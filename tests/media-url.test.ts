import assert from "node:assert/strict";
import test from "node:test";
import { strapiMediaSrcSet, strapiMediaUrl } from "../src/utils/media-url";

const STRAPI = "https://strapi.minkayni.org";

test("keeps canonical CMS media on the CMS origin", () => {
    assert.equal(strapiMediaUrl("/media/uploads/photo one.jpg", STRAPI), `${STRAPI}/media/uploads/photo%20one.jpg`);
    assert.equal(strapiMediaUrl(`${STRAPI}/media/uploads/photo.jpg`, STRAPI), `${STRAPI}/media/uploads/photo.jpg`);
});

test("migrates legacy Strapi routes without an Imagor signature", () => {
    assert.equal(strapiMediaUrl("/api/imagor/uploads/photo.jpg", STRAPI), `${STRAPI}/media/uploads/photo.jpg`);
    assert.equal(strapiMediaUrl("/api/media/uploads/reel.mp4", STRAPI), `${STRAPI}/media/uploads/reel.mp4`);
    assert.equal(strapiMediaUrl("/uploads/logo.svg", STRAPI), `${STRAPI}/media/uploads/logo.svg`);
});

test("migrates direct s3-media-edge URLs to the CMS proxy", () => {
    assert.equal(strapiMediaUrl("https://img.minkayni.org/img/original/uploads/photo.jpg", STRAPI), `${STRAPI}/media/uploads/photo.jpg`);
    assert.equal(strapiMediaUrl("https://img.minkayni.org/raw/uploads/reel.mp4", STRAPI), `${STRAPI}/media/uploads/reel.mp4`);
});

test("adds width only to raster images", () => {
    assert.equal(strapiMediaUrl("/media/uploads/photo.jpg", STRAPI, 800), `${STRAPI}/media/uploads/photo.jpg?w=800`);
    assert.equal(strapiMediaUrl("/media/uploads/logo.svg", STRAPI, 800), `${STRAPI}/media/uploads/logo.svg`);
    assert.equal(strapiMediaUrl("/media/uploads/reel.mp4", STRAPI, 800), `${STRAPI}/media/uploads/reel.mp4`);
});

test("generates responsive candidates through the CMS", () => {
    assert.equal(
        strapiMediaSrcSet("/media/uploads/photo.jpg", STRAPI, [320, 640, 960]),
        [320, 640, 960].map((width) => `${STRAPI}/media/uploads/photo.jpg?w=${width} ${width}w`).join(", ")
    );
    assert.equal(strapiMediaSrcSet("/media/uploads/logo.svg", STRAPI, [320, 640]), "");
});

test("rejects traversal and preserves unrelated URLs", () => {
    assert.equal(strapiMediaUrl("/media/../private/file.jpg", STRAPI), "");
    assert.equal(strapiMediaUrl("/media/uploads/%2e%2e%2fprivate.jpg", STRAPI), "");
    assert.equal(strapiMediaUrl("/media/uploads/%252e%252e/private.jpg", STRAPI), "");
    assert.equal(strapiMediaUrl("/media/uploads/%255cprivate.jpg", STRAPI), "");
    assert.equal(strapiMediaUrl("https://www.example.org/cover.jpg", STRAPI), "https://www.example.org/cover.jpg");
    assert.equal(strapiMediaUrl("https://www.example.org/media/cover.jpg", STRAPI), "https://www.example.org/media/cover.jpg");
    assert.equal(strapiMediaUrl("data:image/png;base64,abc", STRAPI), "");
    assert.equal(strapiMediaUrl("javascript:/media/uploads/photo.jpg", STRAPI), "");
    assert.equal(strapiMediaUrl(undefined, STRAPI), "");
});

test("normalizes GraphQL format URLs and keeps encoded keys stable", () => {
    const source = "/media/uploads/thumbnail_DSC_4676_7e566c6b65.jpg";
    assert.equal(strapiMediaUrl(source, STRAPI, 640), `${STRAPI}/media/uploads/thumbnail_DSC_4676_7e566c6b65.jpg?w=640`);
});

test("keeps video raw while optimizing its raster poster", () => {
    assert.equal(strapiMediaUrl("/media/uploads/reel.mp4", STRAPI), `${STRAPI}/media/uploads/reel.mp4`);
    assert.equal(strapiMediaUrl("/media/uploads/reel-poster.jpg", STRAPI, 800), `${STRAPI}/media/uploads/reel-poster.jpg?w=800`);
});
