import Link from "next/link";
import { formatDate } from "../../../lib/format";
import { timeValue, useSortedItems } from "../../../lib/sort";
import { ADMIN_ROUTES } from "../../../navigation/paths";
import { SortHeader } from "../../../ui/sort-header";
import { StatusBadge } from "../../../ui/status-badge";
import type { Clinician } from "../api/types";

function invitation(clinician: Clinician): string {
  if (clinician.status !== "INVITED" || !clinician.invitationExpiresAt) return "—";
  const expires = new Date(clinician.invitationExpiresAt);
  return expires.getTime() < Date.now() ? `Expired ${formatDate(expires)}` : `Expires ${formatDate(expires)}`;
}

const ACCESSORS = {
  name: (c: Clinician) => c.name,
  email: (c: Clinician) => c.email,
  status: (c: Clinician) => c.status,
  invitation: (c: Clinician) => (c.status === "INVITED" ? timeValue(c.invitationExpiresAt) : null),
  added: (c: Clinician) => timeValue(c.createdAt),
};

export function ClinicianTable({ clinicians }: { clinicians: Clinician[] }) {
  const { sorted, sort, toggle } = useSortedItems(clinicians, ACCESSORS);
  return (
    <div className="overflow-x-auto rounded-2xl border">
      <table className="w-full min-w-[40rem] text-left text-sm">
        <caption className="sr-only">Clinicians</caption>
        <thead className="bg-muted/50 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <SortHeader label="Name" column="name" sort={sort} onSort={toggle} />
            <SortHeader label="Email" column="email" sort={sort} onSort={toggle} />
            <SortHeader label="Status" column="status" sort={sort} onSort={toggle} />
            <SortHeader label="Invitation" column="invitation" sort={sort} onSort={toggle} />
            <SortHeader label="Added" column="added" sort={sort} onSort={toggle} />
          </tr>
        </thead>
        <tbody className="divide-y">
          {sorted.map((clinician) => (
            <tr key={clinician.id}>
              <th scope="row" className="px-4 py-3 font-medium">
                <Link href={`${ADMIN_ROUTES.clinicians}/${encodeURIComponent(clinician.id)}`} className="hover:underline">
                  {clinician.name}
                </Link>
              </th>
              <td className="px-4 py-3 text-muted-foreground">{clinician.email}</td>
              <td className="px-4 py-3"><StatusBadge status={clinician.status} /></td>
              <td className="px-4 py-3 text-muted-foreground">{invitation(clinician)}</td>
              <td className="px-4 py-3 text-muted-foreground">{formatDate(clinician.createdAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
