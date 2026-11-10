import { toNextJsHandler } from "better-auth/next-js";
import { NextResponse } from "next/server";

import { auth } from "../../../../services";

const off = () => NextResponse.json({ error: "Accounts aren't switched on for this site" }, { status: 404 });

export const { GET, POST } = auth ? toNextJsHandler(auth) : { GET: off, POST: off };
