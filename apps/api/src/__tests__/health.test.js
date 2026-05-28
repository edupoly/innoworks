import request from "supertest";
import { app } from '../index.js';
import mongoose from "mongoose";

describe("Health Check", () => {
  afterAll(async () => {
    await mongoose.connection.close();
  });

  it("should return 200 and status ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toEqual(expect.objectContaining({ status: "ok" }));
  });
});
