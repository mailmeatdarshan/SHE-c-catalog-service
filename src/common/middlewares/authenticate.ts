import { expressjwt, type GetVerificationKey } from "express-jwt";
import JwksClient from "jwks-rsa";
import type { Request, RequestHandler } from "express";
import { AuthCookie } from "../types";
import config from "config";

export default expressjwt({
    secret: JwksClient.expressJwtSecret({
        jwksUri: config.get<string>("auth.jwksUri"),
        cache: true,
        rateLimit: true,
    }) as GetVerificationKey,
    algorithms: ["RS256"],
    getToken(req: Request) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.split(" ")[1] !== "undefined") {
            const token = authHeader.split(" ")[1];

            if (token) {
                return token;
            }
        }

        const { accessToken } = (req.cookies as AuthCookie) || {};
        return accessToken;
    },
}) as RequestHandler;
