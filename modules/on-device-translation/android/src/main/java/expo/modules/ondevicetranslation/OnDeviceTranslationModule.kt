package expo.modules.ondevicetranslation

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import com.google.mlkit.nl.translate.TranslateLanguage
import com.google.mlkit.nl.translate.Translation
import com.google.mlkit.nl.translate.TranslatorOptions
import com.google.mlkit.common.model.DownloadConditions

class OnDeviceTranslationModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("OnDeviceTranslation")
    AsyncFunction("translate") { text: String, source: String, target: String, promise: Promise ->
      val from = TranslateLanguage.fromLanguageTag(source)
      val to = TranslateLanguage.fromLanguageTag(target)
      if (from == null || to == null) {
        promise.reject("UNSUPPORTED_LANGUAGE", "Deze taal wordt niet ondersteund op dit toestel", null)
      } else {
        val translator = Translation.getClient(TranslatorOptions.Builder().setSourceLanguage(from).setTargetLanguage(to).build())
        translator.downloadModelIfNeeded(DownloadConditions.Builder().requireWifi().build())
          .addOnSuccessListener {
            translator.translate(text)
              .addOnSuccessListener { value -> promise.resolve(value); translator.close() }
              .addOnFailureListener { error -> promise.reject("TRANSLATION_FAILED", error.message, error); translator.close() }
          }
          .addOnFailureListener { error -> promise.reject("MODEL_DOWNLOAD_FAILED", error.message, error); translator.close() }
      }
    }
  }
}
