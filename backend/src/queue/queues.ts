import { Queue } from "bullmq";
import { redisConnection } from "../config/redis";

export const scanQueue = new Queue("scanQueue", {
  connection: redisConnection,
});
export const aiQueue = new Queue("aiQueue", { connection: redisConnection });
