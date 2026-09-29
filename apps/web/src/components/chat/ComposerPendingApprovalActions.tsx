import {
  type ApprovalRequestId,
  type ProviderApprovalDecision,
  type ProviderApprovalOption,
} from "@t3tools/contracts";
import { memo, useState } from "react";
import { EllipsisIcon, MessageSquareIcon, TriangleAlertIcon, XIcon } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "../ui/menu";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { composerFloatingLayerProps } from "./composerEventScope";
import {
  isRejectionDecision,
  MAX_APPROVAL_REASON_LENGTH,
  normalizeApprovalReason,
} from "./approvalResponseReason.logic";

interface ComposerPendingApprovalActionsProps {
  requestId: ApprovalRequestId;
  isResponding: boolean;
  options?: ReadonlyArray<ProviderApprovalOption> | undefined;
  onRespondToApproval: (
    requestId: ApprovalRequestId,
    decision: ProviderApprovalDecision,
    reason?: string,
  ) => Promise<unknown>;
}

const DEFAULT_APPROVAL_OPTIONS = [
  { decision: "cancel", label: "Cancel" },
  { decision: "decline", label: "Decline" },
  { decision: "acceptForSession", label: "Always allow this session" },
  { decision: "accept", label: "Approve" },
] satisfies ReadonlyArray<ProviderApprovalOption>;

export const ComposerPendingApprovalActions = memo(function ComposerPendingApprovalActions({
  requestId,
  isResponding,
  options = DEFAULT_APPROVAL_OPTIONS,
  onRespondToApproval,
}: ComposerPendingApprovalActionsProps) {
  // The reason lives here rather than above the card so it costs one icon in
  // the resting row and nothing at all until a reviewer asks for it.
  const [reasonDraft, setReasonDraft] = useState("");
  const [isReasonOpen, setIsReasonOpen] = useState(false);
  const primaryOptions = options.filter(
    (option) => option.decision === "decline" || option.decision === "accept",
  );
  const moreOptions = options.filter(
    (option) => option.decision !== "decline" && option.decision !== "accept",
  );
  // Nothing to explain without a way to refuse: an approval-only request has
  // no rejection to attach a reason to.
  const rejection = options.find((option) => isRejectionDecision(option.decision));

  const respond = (decision: ProviderApprovalDecision) => {
    const reason = isRejectionDecision(decision) ? normalizeApprovalReason(reasonDraft) : undefined;
    setReasonDraft("");
    setIsReasonOpen(false);
    return onRespondToApproval(requestId, decision, reason);
  };

  return (
    <>
      {rejection && !isReasonOpen ? (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                size="icon-xs"
                variant="ghost-muted"
                disabled={isResponding}
                aria-label="Explain the decline"
                onClick={() => setIsReasonOpen(true)}
              >
                <MessageSquareIcon />
              </Button>
            }
          />
          <TooltipPopup side="top">Explain the decline to the agent</TooltipPopup>
        </Tooltip>
      ) : null}
      {isReasonOpen ? (
        <span className="flex w-44 items-center gap-1">
          <Input
            autoFocus
            size="compact"
            value={reasonDraft}
            maxLength={MAX_APPROVAL_REASON_LENGTH}
            disabled={isResponding}
            placeholder="Why not? Sent to the agent"
            aria-label="Reason for declining"
            onValueChange={setReasonDraft}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setIsReasonOpen(false);
                return;
              }
              if (event.key !== "Enter" || !rejection) return;
              event.preventDefault();
              void respond(rejection.decision);
            }}
          />
          <Button
            size="icon-xs"
            variant="ghost-muted"
            disabled={isResponding}
            aria-label="Discard the decline reason"
            onClick={() => {
              setReasonDraft("");
              setIsReasonOpen(false);
            }}
          >
            <XIcon />
          </Button>
        </span>
      ) : null}
      {primaryOptions.map((option) => {
        const button = (
          <Button
            key={option.decision}
            size="xs"
            variant={option.decision === "accept" ? "default" : "outline"}
            disabled={isResponding}
            aria-description={option.warning}
            onClick={() => void respond(option.decision)}
          >
            {option.warning ? <TriangleAlertIcon className="size-3 shrink-0" /> : null}
            <span className="max-w-40 truncate">{option.label}</span>
          </Button>
        );
        return option.warning ? (
          <Tooltip key={option.decision}>
            <TooltipTrigger render={button} />
            <TooltipPopup side="top">{option.warning}</TooltipPopup>
          </Tooltip>
        ) : (
          button
        );
      })}
      {moreOptions.length > 0 ? (
        <Menu>
          <MenuTrigger
            disabled={isResponding}
            render={<Button size="icon-xs" variant="outline" aria-label="More approval options" />}
          >
            <EllipsisIcon />
          </MenuTrigger>
          <MenuPopup {...composerFloatingLayerProps} side="top" align="end">
            {moreOptions.map((option) => {
              const item = (
                <MenuItem
                  key={option.decision}
                  disabled={isResponding}
                  aria-description={option.warning}
                  onClick={() => void respond(option.decision)}
                  variant="ghost"
                  className="mb-1 last:mb-0"
                >
                  {option.warning ? <TriangleAlertIcon className="size-3 text-warning" /> : null}
                  <span className="min-w-0 whitespace-normal wrap-break-word">{option.label}</span>
                </MenuItem>
              );
              return option.warning ? (
                <Tooltip key={option.decision}>
                  <TooltipTrigger render={item} />
                  <TooltipPopup side="top">{option.warning}</TooltipPopup>
                </Tooltip>
              ) : (
                item
              );
            })}
          </MenuPopup>
        </Menu>
      ) : null}
    </>
  );
});
