"use client";

import { ShareEmbedSurvey } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/ShareEmbedSurvey";
import { SuccessMessage } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/(analysis)/summary/components/SuccessMessage";
import { SurveyStatusDropdown } from "@/app/(app)/environments/[environmentId]/surveys/[surveyId]/components/SurveyStatusDropdown";
import { BellRing, Code2Icon, Eye, LinkIcon, SquarePenIcon, UsersRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { TEnvironment } from "@formbricks/types/environment";
import { TSurvey } from "@formbricks/types/surveys/types";
import { TUser } from "@formbricks/types/user";
import { Badge } from "@formbricks/ui/components/Badge";
import { Button } from "@formbricks/ui/components/Button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@formbricks/ui/components/Tooltip";

interface SurveyAnalysisCTAProps {
  survey: TSurvey;
  environment: TEnvironment;
  isReadOnly: boolean;
  webAppUrl: string;
  user: TUser;
}

interface ModalState {
  share: boolean;
  embed: boolean;
  panel: boolean;
  dropdown: boolean;
}

export const SurveyAnalysisCTA = ({
  survey,
  environment,
  isReadOnly,
  webAppUrl,
  user,
}: SurveyAnalysisCTAProps) => {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();

  const [modalState, setModalState] = useState<ModalState>({
    share: searchParams.get("share") === "true",
    embed: false,
    panel: false,
    dropdown: false,
  });

  const surveyUrl = useMemo(() => `${webAppUrl}/s/${survey.id}`, [survey.id, webAppUrl]);

  const widgetSetupCompleted = survey.type === "app" && environment.appSetupCompleted;

  useEffect(() => {
    setModalState((prev) => ({
      ...prev,
      share: searchParams.get("share") === "true",
    }));
  }, [searchParams]);

  const handleShareModalToggle = (open: boolean) => {
    const params = new URLSearchParams(window.location.search);
    if (open) {
      params.set("share", "true");
    } else {
      params.delete("share");
    }
    router.push(`${pathname}?${params.toString()}`);
    setModalState((prev) => ({ ...prev, share: open }));
  };

  const handleCopyLink = () => {
    navigator.clipboard
      .writeText(surveyUrl)
      .then(() => {
        toast.success(t("common.copied_to_clipboard"));
      })
      .catch((err) => {
        toast.error(t("environments.surveys.summary.failed_to_copy_link"));
        console.error(err);
      });
    setModalState((prev) => ({ ...prev, dropdown: false }));
  };

  const getPreviewUrl = () => {
    const separator = surveyUrl.includes("?") ? "&" : "?";
    return `${surveyUrl}${separator}preview=true`;
  };

  const handleModalState = (modalView: keyof Omit<ModalState, "dropdown">) => {
    return (open: boolean | ((prevState: boolean) => boolean)) => {
      const newValue = typeof open === "function" ? open(modalState[modalView]) : open;
      setModalState((prev) => ({ ...prev, [modalView]: newValue }));
    };
  };

  const shareEmbedViews = [
    { key: "share", modalView: "start" as const, setOpen: handleShareModalToggle },
    { key: "embed", modalView: "embed" as const, setOpen: handleModalState("embed") },
    { key: "panel", modalView: "panel" as const, setOpen: handleModalState("panel") },
  ];

  return (
    <div className="hidden justify-end gap-x-1.5 sm:flex">
      {survey.resultShareKey && (
        <Badge
          text={t("environments.surveys.summary.results_are_public")}
          type="warning"
          size="normal"
          className="rounded-lg"
        />
      )}

      {!isReadOnly && (widgetSetupCompleted || survey.type === "link") && survey.status !== "draft" && (
        <SurveyStatusDropdown environment={environment} survey={survey} />
      )}

      <TooltipProvider delayDuration={50}>
        <div className="border-formbricks-border-primary flex items-center justify-center rounded-lg border bg-transparent">
          {survey.type === "link" && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  onClick={(e) => {
                    e.currentTarget.blur();
                    window.open(getPreviewUrl(), "_blank");
                  }}
                  variant="minimal"
                  size="sm"
                  className="border-formbricks-border-primary rounded-none border-y-0 border-l-0 bg-transparent focus:ring-0">
                  <Eye />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t("Preview")}</TooltipContent>
            </Tooltip>
          )}

          {!isReadOnly && (
            <div>
              {survey.type === "link" && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={(e) => {
                        e.currentTarget.blur();
                        handleCopyLink();
                      }}
                      size="sm"
                      variant="minimal"
                      className="border-formbricks-border-primary rounded-none border-y-0 border-l-0 bg-transparent focus:ring-0">
                      <LinkIcon />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t("Copy Link")}</TooltipContent>
                </Tooltip>
              )}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => {
                      e.currentTarget.blur();
                      handleModalState("embed")(true);
                    }}
                    size="sm"
                    variant="minimal"
                    className="border-formbricks-border-primary rounded-none border-y-0 border-l-0 bg-transparent focus:ring-0">
                    <Code2Icon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("Embed")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="minimal"
                    href={`/environments/${survey.environmentId}/settings/notifications`}
                    className="border-formbricks-border-primary rounded-none border-y-0 border-l-0 bg-transparent focus:ring-0"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      setModalState((prev) => ({ ...prev, dropdown: false }));
                    }}>
                    <BellRing />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("Alerts")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="sm"
                    variant="minimal"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      handleModalState("panel")(true);
                      setModalState((prev) => ({ ...prev, dropdown: false }));
                    }}
                    className="border-formbricks-border-primary rounded-none border-y-0 border-l-0 bg-transparent focus:ring-0">
                    <UsersRound />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("Send to Panel")}</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    onClick={(e) => e.currentTarget.blur()}
                    href={`/environments/${environment.id}/surveys/${survey.id}/edit`}
                    variant="minimal"
                    size="sm"
                    className="border-formbricks-border-primary rounded-none border-y-0 border-l-0 bg-transparent focus:ring-0">
                    <SquarePenIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t("Edit")}</TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </TooltipProvider>

      {user && (
        <>
          {shareEmbedViews.map(({ key, modalView, setOpen }) => (
            <ShareEmbedSurvey
              key={key}
              survey={survey}
              open={modalState[key as keyof ModalState]}
              setOpen={setOpen}
              webAppUrl={webAppUrl}
              user={user}
              modalView={modalView}
            />
          ))}
          <SuccessMessage environment={environment} survey={survey} />
        </>
      )}
    </div>
  );
};
