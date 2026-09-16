/** An academy manager's "Membership Requests" tab: review and approve/reject pending join requests. */

import { useEffect, useState } from "react";
import type { ChangeEvent, ReactElement } from "react";

import type { ManagerMembershipRequestList, ManagerMembershipRequestRow } from "../api/managerMembershipRequestsApi";
import { buildMembershipRequestsUrl, listMembershipRequests } from "../api/managerMembershipRequestsApi";
import { removeMember, updateMember } from "../api/managerMembersApi";
import { SmallButton } from "../components/ui/SmallButton";
import { logger } from "../utils/logger";
import { getAcademySubdomain } from "../utils/subdomain";

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; page: ManagerMembershipRequestList };

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

export function MembershipRequestsPage(): ReactElement {
  const subdomain = getAcademySubdomain();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [name, setName] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  function load(url?: string): void {
    if (!subdomain) return;
    setState({ status: "loading" });
    listMembershipRequests(url, subdomain)
      .then((page) => setState({ status: "ready", page }))
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not load membership requests.";
        logger.error("Failed to load membership requests", { error: message });
        setState({ status: "error", message });
      });
  }

  useEffect(() => {
    if (!subdomain) return undefined;
    const timeout = window.setTimeout(() => {
      load(buildMembershipRequestsUrl(subdomain, name));
    }, 300);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally only reacts to name/subdomain
  }, [name, subdomain]);

  function reload(): void {
    if (!subdomain) return;
    load(buildMembershipRequestsUrl(subdomain, name));
  }

  function handleApprove(request: ManagerMembershipRequestRow): void {
    if (!subdomain) return;
    setActionError(null);
    setBusyId(request.id);
    updateMember(subdomain, request.id, { status: "active" })
      .then(() => reload())
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not approve that request.";
        logger.error("Failed to approve membership request", { error: message });
        setActionError(message);
      })
      .finally(() => setBusyId(null));
  }

  function handleReject(request: ManagerMembershipRequestRow): void {
    if (!subdomain) return;
    const warning = `Reject ${request.first_name} ${request.last_name}'s request to join?`;
    if (!window.confirm(warning)) return;

    setActionError(null);
    setBusyId(request.id);
    removeMember(subdomain, request.id)
      .then(() => reload())
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : "Could not reject that request.";
        logger.error("Failed to reject membership request", { error: message });
        setActionError(message);
      })
      .finally(() => setBusyId(null));
  }

  // Every pending request is answered against the academy's current set of join-request
  // fields (see ManagerMembershipRequestListView), so any row's answers give the full,
  // consistently-ordered column list - no separate fields fetch needed.
  const answerColumns =
    state.status === "ready" && state.page.results.length > 0
      ? state.page.results[0]!.answers.map((entry) => ({ fieldId: entry.field_id, label: entry.label }))
      : [];

  return (
    <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col px-4 py-6 sm:px-8">
      <div className="mb-4 flex shrink-0 items-center">
        <input
          type="text"
          value={name}
          onChange={(event: ChangeEvent<HTMLInputElement>) => setName(event.target.value)}
          placeholder="Search by name…"
          className="w-full max-w-xs rounded-md border border-mint bg-white px-3 py-1.5 text-sm text-black placeholder:text-gray-400 focus:border-pine focus:outline-none"
        />
      </div>

      {actionError && (
        <p className="mb-4 shrink-0 text-sm text-red-400 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">{actionError}</p>
      )}
      {state.status === "error" && (
        <p className="mb-4 shrink-0 text-sm text-red-400 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
          {state.message}
        </p>
      )}

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[22px] border border-mint bg-white/40 shadow-[0_24px_50px_-22px_rgba(0,0,0,0.15)] backdrop-blur-2xl">
        <div className="min-h-0 flex-1 overflow-auto">
          <table className="w-full min-w-[900px] border-collapse text-sm">
            <thead>
              <tr className="sticky top-0 z-10 divide-x divide-gray-300 border-b border-mint bg-white/40 text-left text-xs font-bold uppercase tracking-wider text-mint">
                <th className="whitespace-nowrap px-3 py-3">Name</th>
                <th className="whitespace-nowrap px-3 py-3">Email</th>
                <th className="whitespace-nowrap px-3 py-3">Phone</th>
                <th className="whitespace-nowrap px-3 py-3">Date of birth</th>
                {answerColumns.map((column) => (
                  <th key={column.fieldId} className="whitespace-nowrap px-3 py-3">
                    {column.label}
                  </th>
                ))}
                <th className="whitespace-nowrap px-3 py-3">Requested</th>
                <th className="px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {state.status === "ready" &&
                state.page.results.map((request) => (
                  <tr
                    key={request.id}
                    className="divide-x divide-gray-300 border-b border-gray-300 text-black/80 hover:bg-mint/10"
                  >
                    <td className="whitespace-nowrap px-3 py-3 font-semibold text-black">
                      {request.first_name} {request.last_name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{request.email}</td>
                    <td className="whitespace-nowrap px-3 py-3">{request.phone}</td>
                    <td className="whitespace-nowrap px-3 py-3">{formatDate(request.date_of_birth)}</td>
                    {request.answers.map((entry) => (
                      <td key={entry.field_id} className="px-3 py-3">
                        {entry.answer || <span className="text-gray-300">—</span>}
                      </td>
                    ))}
                    <td className="whitespace-nowrap px-3 py-3">{formatDate(request.joined_at)}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <SmallButton
                          variant="primary"
                          disabled={busyId === request.id}
                          onClick={() => handleApprove(request)}
                        >
                          Approve
                        </SmallButton>
                        <SmallButton
                          variant="danger"
                          disabled={busyId === request.id}
                          onClick={() => handleReject(request)}
                        >
                          Reject
                        </SmallButton>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
          {state.status === "loading" && <p className="py-10 text-center text-gray-500">Loading requests…</p>}
          {state.status === "ready" && state.page.results.length === 0 && (
            <p className="py-10 text-center text-gray-400">No pending requests.</p>
          )}
        </div>

        <div className="flex shrink-0 items-center justify-between border-t border-mint px-4 py-3 text-sm text-gray-500">
          <span>{state.status === "ready" ? state.page.count : "…"} total</span>
          <div className="flex gap-2">
            <SmallButton
              disabled={state.status !== "ready" || !state.page.previous}
              onClick={() => state.status === "ready" && state.page.previous && load(state.page.previous)}
            >
              Previous
            </SmallButton>
            <SmallButton
              disabled={state.status !== "ready" || !state.page.next}
              onClick={() => state.status === "ready" && state.page.next && load(state.page.next)}
            >
              Next
            </SmallButton>
          </div>
        </div>
      </div>
    </div>
  );
}
