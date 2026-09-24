import ExpoModulesCore
import MLKitTranslate
import MLKitCommon

public class OnDeviceTranslationModule: Module {
  public func definition() -> ModuleDefinition {
    Name("OnDeviceTranslation")

    AsyncFunction("translate") { (text: String, source: String, target: String, promise: Promise) in
      guard let from = TranslateLanguage.fromLanguageTag(source),
            let to = TranslateLanguage.fromLanguageTag(target) else {
        promise.reject("UNSUPPORTED_LANGUAGE", "Deze taal wordt niet ondersteund op dit toestel")
        return
      }
      let translator = Translator.translator(options: TranslatorOptions(sourceLanguage: from, targetLanguage: to))
      let conditions = ModelDownloadConditions(allowsCellularAccess: false, allowsBackgroundDownloading: false)
      translator.downloadModelIfNeeded(with: conditions) { error in
        if let error = error {
          promise.reject("MODEL_DOWNLOAD_FAILED", error.localizedDescription)
          return
        }
        translator.translate(text) { result, error in
          if let result = result { promise.resolve(result) }
          else { promise.reject("TRANSLATION_FAILED", error?.localizedDescription ?? "Vertalen mislukt") }
        }
      }
    }
  }
}
