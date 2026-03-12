import { useState } from "react";
import type { Member } from "../../../types";

export function useBanState() {
    const [showBanModal, setShowBanModal] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [banTarget, setBanTarget] = useState<Member | null>(null);
    const [banReason, setBanReason] = useState("");
    const [banMonths, setBanMonths] = useState(0);
    const [banDays, setBanDays] = useState(0);
    const [banHours, setBanHours] = useState(0);
    const [banMinutes, setBanMinutes] = useState(0);
    const [banSeconds, setBanSeconds] = useState(0);
    const [isPermanentBan, setIsPermanentBan] = useState(false);

    const openBanModal = (member: Member, editMode: boolean) => {
        setBanTarget(member);
        setIsEditMode(editMode);
        setShowBanModal(true);
    };

    const closeBanModal = () => {
        setShowBanModal(false);
        setIsEditMode(false);
        setBanTarget(null);
        resetBanForm();
    };

    const resetBanForm = () => {
        setBanReason("");
        setBanMonths(0);
        setBanDays(0);
        setBanHours(0);
        setBanMinutes(0);
        setBanSeconds(0);
        setIsPermanentBan(false);
    };

    const setBanDuration = (months: number, days: number, hours: number, minutes: number, seconds: number) => {
        setBanMonths(months);
        setBanDays(days);
        setBanHours(hours);
        setBanMinutes(minutes);
        setBanSeconds(seconds);
    };

    return {
        showBanModal,
        isEditMode,
        banTarget,
        banReason,
        banMonths,
        banDays,
        banHours,
        banMinutes,
        banSeconds,
        isPermanentBan,
        setBanReason,
        setBanMonths,
        setBanDays,
        setBanHours,
        setBanMinutes,
        setBanSeconds,
        setIsPermanentBan,
        openBanModal,
        closeBanModal,
        resetBanForm,
        setBanDuration,
    };
}
