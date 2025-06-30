import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware";
import { healthcheck } from "../controllers/healthcheck.contoller";
const router = Router();
router.use(verifyJWT);
router.route("/").get(healthcheck);
export default router;
