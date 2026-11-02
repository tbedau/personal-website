// Workers static assets ignore Range requests, which breaks seeking in the
// post audio player (Safari requires 206 responses). This script only runs
// for /audio/* (see run_worker_first in wrangler.jsonc) and serves byte ranges.
export default {
  async fetch(request, env) {
    const res = await env.ASSETS.fetch(request);
    const range = request.headers.get("Range");
    const match = range && /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (!match || res.status !== 200 || (match[1] === "" && match[2] === "")) {
      const headers = new Headers(res.headers);
      if (res.status === 200) headers.set("Accept-Ranges", "bytes");
      return new Response(res.body, { status: res.status, headers });
    }

    const body = await res.arrayBuffer();
    const size = body.byteLength;
    let start;
    let end;
    if (match[1] === "") {
      start = Math.max(0, size - Number(match[2]));
      end = size - 1;
    } else {
      start = Number(match[1]);
      end = match[2] === "" ? size - 1 : Math.min(Number(match[2]), size - 1);
    }
    if (start >= size || start > end) {
      return new Response(null, {
        status: 416,
        headers: { "Content-Range": `bytes */${size}` },
      });
    }

    const headers = new Headers(res.headers);
    headers.set("Accept-Ranges", "bytes");
    headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
    headers.set("Content-Length", String(end - start + 1));
    return new Response(body.slice(start, end + 1), { status: 206, headers });
  },
};
