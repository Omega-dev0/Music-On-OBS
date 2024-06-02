function translator() {
    let elements = document.querySelectorAll("[translated]");
    elements.forEach((element) => {
        try {
            let translation = chrome.i18n.getMessage(
                element.innerHTML
                    .replaceAll(" ", "_")
                    .replace(/[^\x00-\x7F]/g, "")
                    .replaceAll(":", "")
                    .replaceAll("]", "")
                    .replaceAll("[", "")
                    .replaceAll(")", "")
                    .replaceAll("(", "")
            );
            element.innerHTML = translation

            if (element.title != "") {
                element.title = chrome.i18n.getMessage(
                    element.title
                        .replaceAll(" ", "_")
                        .replace(/[^\x00-\x7F]/g, "")
                        .replaceAll(":", "")
                        .replaceAll("]", "")
                        .replaceAll("[", "")
                        .replaceAll(")", "")
                        .replaceAll("(", "")
                );
            }

        } catch (error) {
            console.warn("[TRANSLATOR] - Failed to translate for:", element.innerHTML, error);
        }
    });
}

document.addEventListener("DOMContentLoaded", translator);