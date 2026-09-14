import { requireSessionOrRedirect } from "@/lib/auth";
import ChangePasswordClient from "./ChangePasswordClient";

// Always dynamic: reads the session cookie to authorize the request.
export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
    const session = await requireSessionOrRedirect();

    return <ChangePasswordClient forced={session.mustChangePassword} />;
}
