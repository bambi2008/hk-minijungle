import { spawnSync } from "node:child_process";
if (!process.env.FIVECROP_REVIEW_TOKEN) throw Error("Reviewer token is not configured");
const result = spawnSync("pbcopy", [], { input: process.env.FIVECROP_REVIEW_TOKEN });
if (result.status !== 0) throw Error("Clipboard is unavailable");
console.log("審核憑證已複製。請貼到 FiveCrop 人工審核頁；使用後清空剪貼簿。不要發到聊天或提交 Git。");
