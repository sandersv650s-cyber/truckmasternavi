import { requireNativeModule } from 'expo';

export async function translateOnDevice(text: string, source: string, target: string): Promise<string> {
  if (source === target) return text;
  // Native ML Kit module is bundled in a development/release build, not Expo Go.
  const native = requireNativeModule('OnDeviceTranslation') as { translate(text: string, source: string, target: string): Promise<string> };
  return native.translate(text, source, target);
}
