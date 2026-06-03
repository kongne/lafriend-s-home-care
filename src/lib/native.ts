import { Capacitor } from "@capacitor/core";

export const isNativeApp = (): boolean => Capacitor.isNativePlatform();

export const nativePlatform = (): string => Capacitor.getPlatform();
