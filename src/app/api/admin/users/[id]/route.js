import { requireAdmin, serviceClient } from "@/lib/admin/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Deletes a learner's sign-in account; their profile and saved data are
// removed with it by the database's cascading foreign keys.
export async function DELETE(request, { params }) {
  const { id } = await params;
  if (!UUID.test(id || "")) return Response.json({ error: "Invalid user id" }, { status: 400 });
  const { userId, response } = await requireAdmin(request);
  if (response) return response;
  if (id === userId) return Response.json({ error: "You cannot delete your own account here." }, { status: 400 });
  const admin = serviceClient();
  if (!admin) return Response.json({ error: "Account deletion is not configured on the server." }, { status: 503 });
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) {
    console.error("Admin could not delete user:", error);
    return Response.json({ error: "The account could not be deleted." }, { status: 500 });
  }
  return Response.json({ deleted: id });
}
