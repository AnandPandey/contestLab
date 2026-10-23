import type { FunctionType } from "@/constants/languages";
import type { Language } from "@/app/generated/prisma/enums";

export type FunctionSpec = {
  name: string;
  params: { name: string; type: FunctionType }[];
  returnType: FunctionType;
};

const JAVA: Record<FunctionType, string> = {
  int: "int",
  long: "long",
  double: "double",
  boolean: "boolean",
  string: "String",
  "int[]": "int[]",
  "long[]": "long[]",
  "double[]": "double[]",
  "string[]": "String[]",
};

const CPP: Record<FunctionType, string> = {
  int: "int",
  long: "long long",
  double: "double",
  boolean: "bool",
  string: "string",
  "int[]": "vector<int>",
  "long[]": "vector<long long>",
  "double[]": "vector<double>",
  "string[]": "vector<string>",
};

const PY: Record<FunctionType, string> = {
  int: "int",
  long: "int",
  double: "float",
  boolean: "bool",
  string: "str",
  "int[]": "List[int]",
  "long[]": "List[int]",
  "double[]": "List[float]",
  "string[]": "List[str]",
};

/** C scalar / element types. Arrays are passed as pointer + `<name>Size`. */
const C_ELEM: Record<FunctionType, string> = {
  int: "int",
  long: "long long",
  double: "double",
  boolean: "bool",
  string: "char*",
  "int[]": "int",
  "long[]": "long long",
  "double[]": "double",
  "string[]": "char*",
};

const isArray = (t: FunctionType) => t.endsWith("[]");

function cParam(name: string, type: FunctionType) {
  if (!isArray(type)) return type === "string" ? `const char* ${name}` : `${C_ELEM[type]} ${name}`;
  return `${C_ELEM[type]}* ${name}, int ${name}Size`;
}

/**
 * Builds a LeetCode-style stub for a FUNCTION-mode problem. Java, C++ and Python
 * use a `Solution` class; C uses a free function where arrays are passed as
 * pointer + size and array results are returned via an `int* returnSize`
 * out-parameter (the result must be heap-allocated).
 */
export function functionStarter(spec: FunctionSpec, language: Language): string {
  const { name, params, returnType } = spec;
  switch (language) {
    case "JAVA":
      return [
        "class Solution {",
        `    public ${JAVA[returnType]} ${name}(${params.map((p) => `${JAVA[p.type]} ${p.name}`).join(", ")}) {`,
        "        ",
        "    }",
        "}",
        "",
      ].join("\n");
    case "CPP": {
      const args = params.map((p) => {
        const t = CPP[p.type];
        return isArray(p.type) || p.type === "string" ? `${t}& ${p.name}` : `${t} ${p.name}`;
      });
      return [
        "class Solution {",
        "public:",
        `    ${CPP[returnType]} ${name}(${args.join(", ")}) {`,
        "        ",
        "    }",
        "};",
        "",
      ].join("\n");
    }
    case "PYTHON": {
      const usesList = [...params.map((p) => p.type), returnType].some(isArray);
      return [
        ...(usesList ? ["from typing import List", "", ""] : []),
        "class Solution:",
        `    def ${name}(self${params.map((p) => `, ${p.name}: ${PY[p.type]}`).join("")}) -> ${PY[returnType]}:`,
        "        pass",
        "",
      ].join("\n");
    }
    case "C": {
      const args = params.map((p) => cParam(p.name, p.type));
      if (isArray(returnType)) args.push("int* returnSize");
      const ret = isArray(returnType) ? `${C_ELEM[returnType]}*` : C_ELEM[returnType];
      const needsBool = [...params.map((p) => p.type), returnType].some((t) => t === "boolean");
      return [
        ...(needsBool ? ["#include <stdbool.h>", ""] : []),
        ...(isArray(returnType) ? ["// Return a malloc'd array and set *returnSize to its length.", ""] : []),
        `${ret} ${name}(${args.join(", ")}) {`,
        "    ",
        "}",
        "",
      ].join("\n");
    }
  }
}

/** Minimal full-program templates for STDIN_STDOUT problems. */
export const STDIO_STARTERS: Record<Language, string> = {
  CPP: [
    "#include <bits/stdc++.h>",
    "using namespace std;",
    "",
    "int main() {",
    "    ios::sync_with_stdio(false);",
    "    cin.tie(nullptr);",
    "    ",
    "    return 0;",
    "}",
    "",
  ].join("\n"),
  JAVA: [
    "import java.util.*;",
    "import java.io.*;",
    "",
    "public class Main {",
    "    public static void main(String[] args) throws IOException {",
    "        BufferedReader br = new BufferedReader(new InputStreamReader(System.in));",
    "        ",
    "    }",
    "}",
    "",
  ].join("\n"),
  PYTHON: ["import sys", "", "def main():", "    data = sys.stdin.read().split()", "    ", "", "main()", ""].join(
    "\n",
  ),
  C: ["#include <stdio.h>", "#include <stdlib.h>", "", "int main(void) {", "    ", "    return 0;", "}", ""].join(
    "\n",
  ),
};
