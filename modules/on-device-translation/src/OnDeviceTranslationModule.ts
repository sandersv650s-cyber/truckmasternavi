import { NativeModule, requireNativeModule } from 'expo';

declare class OnDeviceTranslationModule extends NativeModule<{}> {
  translate(text: string, source: string, target: string): Promise<string>;
}

export default requireNativeModule<OnDeviceTranslationModule>('OnDeviceTranslation');
