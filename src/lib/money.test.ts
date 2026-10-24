import {describe,it,expect} from "vitest";import {orderTotal} from "./money";
describe("orderTotal",()=>{it("uses integer minor units",()=>expect(orderTotal([{priceInKopecks:129000,quantity:2},{priceInKopecks:59000,quantity:1}])).toBe(317000))});
