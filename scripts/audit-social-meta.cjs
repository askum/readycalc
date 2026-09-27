#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..");

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    if ([".git", "node_modules"].includes(entry.name)) return [];
    const fullPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(fullPath) : [fullPath];
  });
}

function read(html, pattern, label, file, errors) {
  const match = html.match(pattern);
  if (!match?.[1]?.trim()) {
    errors.push(`${file}: ${label} 누락`);
    return "";
  }
  return match[1].trim();
}

function duplicateValues(records, key) {
  const grouped = new Map();
  records.forEach((record) => {
    const value = record[key];
    if (!value) return;
    grouped.set(value, [...(grouped.get(value) || []), record.file]);
  });
  return [...grouped.entries()].filter(([, files]) => files.length > 1);
}

async function main() {
  const errors = [];
  const warnings = [];
  const htmlFiles = walk(ROOT).filter((file) => path.basename(file) === "index.html");
  const records = [];

  for (const absoluteFile of htmlFiles) {
    const file = path.relative(ROOT, absoluteFile);
    const html = fs.readFileSync(absoluteFile, "utf8");
    const record = {
      file,
      title: read(html, /<title>([\s\S]*?)<\/title>/i, "title", file, errors),
      description: read(html, /<meta\s+name="description"\s+content="([^"]+)"/i, "description", file, errors),
      canonical: read(html, /<link\s+rel="canonical"\s+href="([^"]+)"/i, "canonical", file, errors),
      ogType: read(html, /<meta\s+property="og:type"\s+content="([^"]+)"/i, "og:type", file, errors),
      ogTitle: read(html, /<meta\s+property="og:title"\s+content="([^"]+)"/i, "og:title", file, errors),
      ogDescription: read(html, /<meta\s+property="og:description"\s+content="([^"]+)"/i, "og:description", file, errors),
      ogImage: read(html, /<meta\s+property="og:image"\s+content="([^"]+)"/i, "og:image", file, errors),
      ogUrl: read(html, /<meta\s+property="og:url"\s+content="([^"]+)"/i, "og:url", file, errors),
      twitterCard: read(html, /<meta\s+name="twitter:card"\s+content="([^"]+)"/i, "twitter:card", file, errors),
      twitterTitle: read(html, /<meta\s+name="twitter:title"\s+content="([^"]+)"/i, "twitter:title", file, errors),
      twitterDescription: read(html, /<meta\s+name="twitter:description"\s+content="([^"]+)"/i, "twitter:description", file, errors),
      twitterImage: read(html, /<meta\s+name="twitter:image"\s+content="([^"]+)"/i, "twitter:image", file, errors),
      twitterDomain: read(html, /<meta\s+name="twitter:domain"\s+content="([^"]+)"/i, "twitter:domain", file, errors),
    };

    [
      ["title", /<title>[\s\S]*?<\/title>/gi],
      ["description", /<meta\s+name="description"\s+content="[^"]+"[^>]*>/gi],
      ["canonical", /<link\s+rel="canonical"\s+href="[^"]+"[^>]*>/gi],
      ["og:type", /<meta\s+property="og:type"\s+content="[^"]+"[^>]*>/gi],
      ["og:title", /<meta\s+property="og:title"\s+content="[^"]+"[^>]*>/gi],
      ["og:description", /<meta\s+property="og:description"\s+content="[^"]+"[^>]*>/gi],
      ["og:image", /<meta\s+property="og:image"\s+content="[^"]+"[^>]*>/gi],
      ["og:url", /<meta\s+property="og:url"\s+content="[^"]+"[^>]*>/gi],
      ["twitter:card", /<meta\s+name="twitter:card"\s+content="[^"]+"[^>]*>/gi],
      ["twitter:title", /<meta\s+name="twitter:title"\s+content="[^"]+"[^>]*>/gi],
      ["twitter:description", /<meta\s+name="twitter:description"\s+content="[^"]+"[^>]*>/gi],
      ["twitter:image", /<meta\s+name="twitter:image"\s+content="[^"]+"[^>]*>/gi],
      ["twitter:domain", /<meta\s+name="twitter:domain"\s+content="[^"]+"[^>]*>/gi],
    ].forEach(([label, pattern]) => {
      const count = html.match(pattern)?.length || 0;
      if (count !== 1) errors.push(`${file}: ${label} 태그가 ${count}개`);
    });

    [
      ["og:image:type", /<meta\s+property="og:image:type"\s+content="image\/png"/i],
      ["og:image:width", /<meta\s+property="og:image:width"\s+content="1200"/i],
      ["og:image:height", /<meta\s+property="og:image:height"\s+content="630"/i],
      ["og:image:alt", /<meta\s+property="og:image:alt"\s+content="[^"]+"/i],
      ["twitter:image:alt", /<meta\s+name="twitter:image:alt"\s+content="[^"]+"/i],
      ["og:locale", /<meta\s+property="og:locale"\s+content="ko_KR"/i],
      ["og:site_name", /<meta\s+property="og:site_name"\s+content="생활계산소"/i],
    ].forEach(([label, pattern]) => {
      if (!pattern.test(html)) errors.push(`${file}: ${label} 누락 또는 값 불일치`);
    });

    if (record.canonical !== record.ogUrl) errors.push(`${file}: canonical과 og:url 불일치`);
    if (record.ogImage !== record.twitterImage) errors.push(`${file}: og:image와 twitter:image 불일치`);
    if (record.ogType !== "website") errors.push(`${file}: og:type은 website여야 함`);
    if (record.twitterCard !== "summary_large_image") errors.push(`${file}: twitter:card 값 불일치`);
    if (record.twitterDomain !== "readytools.kr") errors.push(`${file}: twitter:domain 값 불일치`);
    if (record.title.length > 65) warnings.push(`${file}: title ${record.title.length}자`);
    if (record.description.length > 180) warnings.push(`${file}: description ${record.description.length}자`);

    try {
      const imageUrl = new URL(record.ogImage);
      const imageFile = path.join(ROOT, decodeURIComponent(imageUrl.pathname).replace(/^\//, ""));
      if (!fs.existsSync(imageFile)) {
        errors.push(`${file}: OG 이미지 파일 없음 (${imageUrl.pathname})`);
      } else {
        const metadata = await sharp(imageFile).metadata();
        const bytes = fs.statSync(imageFile).size;
        if (metadata.width !== 1200 || metadata.height !== 630) {
          errors.push(`${file}: OG 이미지 규격 ${metadata.width}x${metadata.height}`);
        }
        if (bytes < 5000) errors.push(`${file}: OG 이미지 파일이 5,000바이트 미만`);
      }
    } catch (error) {
      errors.push(`${file}: OG 이미지 검사 실패 (${error.message})`);
    }

    records.push(record);
  }

  ["title", "description", "ogTitle", "ogDescription", "ogImage", "ogUrl"].forEach((key) => {
    duplicateValues(records, key).forEach(([value, files]) => {
      errors.push(`${key} 중복: ${files.join(", ")} (${value})`);
    });
  });

  console.log(`공개 HTML: ${records.length}개`);
  console.log(`고유 OG 이미지: ${new Set(records.map((record) => record.ogImage)).size}개`);
  console.log(`경고: ${warnings.length}개`);
  warnings.forEach((warning) => console.log(`WARN ${warning}`));
  console.log(`오류: ${errors.length}개`);
  errors.forEach((error) => console.error(`ERROR ${error}`));

  if (errors.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
