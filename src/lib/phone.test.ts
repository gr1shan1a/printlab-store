import {describe,expect,it} from "vitest";
import {formatRussianPhone} from "./phone";

describe("formatRussianPhone",()=>{
  it("keeps the Russian prefix and formats ten digits",()=>{
    expect(formatRussianPhone("9991234567")).toBe("+7 (999) 123-45-67");
    expect(formatRussianPhone("8 999 123 45 67")).toBe("+7 (999) 123-45-67");
  });
  it("does not allow removing the country prefix",()=>expect(formatRussianPhone("")).toBe("+7"));
});
