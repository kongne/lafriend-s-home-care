import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/hooks/useAuth";
import { useIdleLogout } from "@/hooks/useIdleLogout";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * Watches for inactivity (10 min by default) and shows a 60s countdown modal
 * before signing the user out for security.
 *
 * Only active while the user is authenticated.
 */
export const SessionTimeoutDialog = () => {
  const { user, signOut } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleTimeout = async () => {
    try {
      await signOut();
    } finally {
      navigate("/auth", { replace: true });
      toast.info(t("session.timeoutToast"));
    }
  };

  const { warningOpen, remaining, dismissWarningAndReset } = useIdleLogout({
    idleMs: 10 * 60 * 1000,
    warningMs: 60 * 1000,
    onTimeout: handleTimeout,
    enabled: !!user,
  });

  const handleLogoutNow = async () => {
    dismissWarningAndReset();
    await signOut();
    navigate("/auth", { replace: true });
  };

  return (
    <AlertDialog open={warningOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("session.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("session.message")}{" "}
            <span className="font-semibold text-foreground">
              {remaining}s
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleLogoutNow}>
            {t("session.logoutNow")}
          </AlertDialogCancel>
          <AlertDialogAction onClick={dismissWarningAndReset}>
            {t("session.stay")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};