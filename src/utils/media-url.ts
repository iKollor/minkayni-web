const RASTER_IMAGE = /\.(?:jpe?g|png|webp|avif|gif)$/i;
const LEGACY_MEDIA_HOSTS = new Set(["img.minkayni.org"]);

function decodedSegment(segment: string): string | null {
    try {
        return decodeURIComponent(segment);
    } catch {
        return null;
    }
}

function isUnsafeSegment(segment: string): boolean {
    let candidate = segment;

    for (let depth = 0; depth < 4; depth += 1) {
        const decoded = decodedSegment(candidate);
        if (decoded === null) return true;
        if (decoded === "." || decoded === ".." || decoded.includes("/") || decoded.includes("\\") || /[\u0000-\u001f\u007f]/.test(decoded)) return true;
        if (decoded === candidate) return false;
        candidate = decoded;
    }

    return decodedSegment(candidate) !== candidate;
}

function hasTraversal(src: string): boolean {
    const rawPath = src.replace(/^(?:https?:)?\/\/[^/]+/i, "").split(/[?#]/, 1)[0];

    return rawPath.split("/").some(isUnsafeSegment);
}

function encodedKey(rawKey: string): string | null {
    const segments = rawKey.split("/");
    if (segments.some((segment) => !segment)) return null;

    const encoded: string[] = [];
    for (const segment of segments) {
        if (isUnsafeSegment(segment)) return null;
        const decoded = decodedSegment(segment);
        if (decoded === null) return null;
        encoded.push(encodeURIComponent(decoded));
    }

    return encoded.join("/");
}

function mediaKey(pathname: string): string | null {
    const routes: RegExp[] = [/^\/media\/(.+)$/, /^\/api\/imagor\/(.+)$/, /^\/api\/media\/(.+)$/, /^\/img\/(?:original|\d+)\/(.+)$/, /^\/(?:raw|doc)\/(.+)$/];

    for (const route of routes) {
        const match = pathname.match(route);
        if (match) return encodedKey(match[1]);
    }

    const upload = pathname.match(/^\/uploads\/(.+)$/);
    return upload ? encodedKey(`uploads/${upload[1]}`) : null;
}

function normalizedBase(strapiBase: string): string {
    try {
        return new URL(strapiBase).origin;
    } catch {
        return "";
    }
}

function isRecognizedOrigin(src: string, sourceUrl: URL, base: string): boolean {
    const isAbsolute = /^(?:https?:)?\/\//i.test(src);
    return !isAbsolute || sourceUrl.origin === base || LEGACY_MEDIA_HOSTS.has(sourceUrl.hostname.toLowerCase());
}

export function strapiMediaUrl(src: string | null | undefined, strapiBase: string, width = 0): string {
    if (!src) return "";
    if (hasTraversal(src)) return "";

    const base = normalizedBase(strapiBase);
    if (!base) return "";

    let sourceUrl: URL;
    try {
        sourceUrl = new URL(src, base);
    } catch {
        return "";
    }

    if (sourceUrl.protocol !== "http:" && sourceUrl.protocol !== "https:") return "";

    if (!isRecognizedOrigin(src, sourceUrl, base)) return src;

    const key = mediaKey(sourceUrl.pathname);
    if (!key) return src;

    const url = `${base}/media/${key}`;
    const safeWidth = Math.min(Math.max(Math.trunc(width), 16), 3840);
    return width > 0 && RASTER_IMAGE.test(key) ? `${url}?w=${safeWidth}` : url;
}

export function strapiMediaSrcSet(src: string | null | undefined, strapiBase: string, widths: readonly number[]): string {
    const original = strapiMediaUrl(src, strapiBase);
    const base = normalizedBase(strapiBase);
    if (!base || !original.startsWith(`${base}/media/`)) return "";
    if (!RASTER_IMAGE.test(new URL(original).pathname)) return "";

    return [...new Set(widths)]
        .filter((width) => Number.isInteger(width) && width >= 16 && width <= 3840)
        .sort((a, b) => a - b)
        .map((width) => `${strapiMediaUrl(src, strapiBase, width)} ${width}w`)
        .join(", ");
}
