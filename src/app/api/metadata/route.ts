import { NextRequest, NextResponse } from "next/server";
import { PeecApiClient } from "@/lib/peecai-client";
import { decrypt } from "@/lib/cookie";
import type { Brand, Model, Prompt } from "@/lib/types";

export async function GET(request: NextRequest) {
  try {
    const encryptedKey = request.cookies.get("peecai_key")?.value;
    if (!encryptedKey) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const apiKey = decrypt(encryptedKey);
    const projectId = request.nextUrl.searchParams.get("project_id");
    if (!projectId) {
      return NextResponse.json({ error: "project_id is required" }, { status: 400 });
    }

    const client = new PeecApiClient(apiKey);

    const [brands, models, prompts] = await Promise.all([
      client.get<Brand[]>("/brands", { project_id: projectId, limit: 1000 }),
      client.get<Model[]>("/models", { project_id: projectId, limit: 1000 }),
      client.get<Prompt[]>("/prompts", { project_id: projectId, limit: 1000 }),
    ]);

    return NextResponse.json({ brands, models, prompts });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
