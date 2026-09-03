import type { APIRoute } from "astro";
import fs from "node:fs/promises";
import path from "node:path";

export const GET: APIRoute = async () => {
  return new Response(
    JSON.stringify({ status: "API activa para gestión de blog" }),
    {
      status: 200,
      headers: { "Content-Type": "application/json" },
    }
  );
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();
    const {
      title,
      slug,
      oldSlug,
      description,
      tag,
      readTime,
      date,
      author,
      image,
      content,
      password,
    } = data;

    // Validación de seguridad
    if (password !== "TorresDental2026!") {
      return new Response(
        JSON.stringify({ error: "Credenciales no autorizadas" }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!title || !slug || !content) {
      return new Response(
        JSON.stringify({ error: "Título, slug y contenido son requeridos" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Normalizar slug
    const cleanSlug = slug
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9-]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");

    const mdContent = `---
title: "${title.replace(/"/g, '\\"')}"
description: "${description ? description.replace(/"/g, '\\"') : ""}"
date: "${date || "03 Mar 2026"}"
author: "${author || "Od. Alexis Torres"}"
tag: "${tag || "Salud Bucal"}"
readTime: "${readTime || "5 min de lectura"}"
image: "${image || "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?q=80&w=1000&auto=format&fit=crop"}"
avatar: "/logo.png"
---

${content.trim()}
`;

    const blogDir = path.resolve(process.cwd(), "src/content/blog");
    const filePath = path.join(blogDir, `${cleanSlug}.md`);

    await fs.mkdir(blogDir, { recursive: true });

    // Si cambió el slug durante la edición, borrar el archivo anterior
    if (oldSlug && oldSlug !== cleanSlug) {
      const oldCleanSlug = oldSlug
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      const oldFilePath = path.join(blogDir, `${oldCleanSlug}.md`);
      try {
        await fs.unlink(oldFilePath);
      } catch {
        // Ignorar si no existía
      }
    }

    await fs.writeFile(filePath, mdContent, "utf-8");

    return new Response(
      JSON.stringify({
        success: true,
        message: oldSlug ? "Nota de blog actualizada exitosamente" : "Nota de blog creada exitosamente",
        slug: cleanSlug,
        filePath,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err?.message || "Error al procesar la solicitud" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
