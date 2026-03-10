import { NextResponse } from "next/server";
import { PeecApiClient } from "@/lib/peecai-client";
import { encrypt } from "@/lib/cookie";
import { extractProjectId } from "@/lib/utils";
import type { Brand, Project } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { apiKey, anthropicKey } = (await request.json()) as { apiKey: string; anthropicKey?: string };

    if (!apiKey || (!apiKey.startsWith("skp-") && !apiKey.startsWith("skc-"))) {
      return NextResponse.json(
        { error: "Invalid API key format. Keys start with 'skp-' (project) or 'skc-' (account)." },
        { status: 400 },
      );
    }

    const client = new PeecApiClient(apiKey);
    const isAccountKey = apiKey.startsWith("skc-");

    if (isAccountKey) {
      // Account-wide key: fetch all projects
      let projects: Project[];
      try {
        projects = await client.get<Project[]>("/projects", { limit: 1000 });
      } catch {
        return NextResponse.json(
          { error: "API key validation failed. Please check your key and try again." },
          { status: 401 },
        );
      }

      // Filter to active projects only
      const activeProjects = projects.filter(
        (p) => !["DELETED", "CUSTOMER_ENDED", "PITCH_ENDED", "TRIAL_ENDED"].includes(p.status),
      );

      const encrypted = encrypt(apiKey);
      const response = NextResponse.json({
        valid: true,
        keyType: "account" as const,
        projects: activeProjects,
      });

      response.cookies.set("peecai_key", encrypted, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24,
        path: "/",
      });

      if (anthropicKey) {
        const encryptedAnthropicKey = encrypt(anthropicKey);
        response.cookies.set("anthropic_key", encryptedAnthropicKey, {
          httpOnly: true,
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          maxAge: 60 * 60 * 24,
          path: "/",
        });
      }

      return response;
    }

    // Brand-specific key: extract project ID from the key
    const projectId = extractProjectId(apiKey);
    if (!projectId) {
      return NextResponse.json(
        { error: "Could not extract project ID from API key." },
        { status: 400 },
      );
    }

    // Validate by fetching brands (project-scoped keys can't call /projects)
    let brands: Brand[];
    try {
      brands = await client.get<Brand[]>("/brands", {
        project_id: projectId,
        limit: 1000,
      });
    } catch {
      return NextResponse.json(
        { error: "API key validation failed. Please check your key and try again." },
        { status: 401 },
      );
    }

    // Set encrypted cookie
    const encrypted = encrypt(apiKey);
    const response = NextResponse.json({
      valid: true,
      keyType: "project" as const,
      projectId,
      projectName: projectId,
      brands,
    });

    response.cookies.set("peecai_key", encrypted, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24,
      path: "/",
    });

    // Store Anthropic key if provided
    if (anthropicKey) {
      const encryptedAnthropicKey = encrypt(anthropicKey);
      response.cookies.set("anthropic_key", encryptedAnthropicKey, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60 * 24,
        path: "/",
      });
    }

    return response;
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
