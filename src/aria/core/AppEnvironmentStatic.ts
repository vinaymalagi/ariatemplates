export const applicationSettings = {
    appSettings: {
      devMode: false,
      debug: false,
      waiAria: false
    },
    language: {
      primaryLanguage: "en",
      region: "US"
    },
    defaultWidgetLibs: {
      aria: "aria.widgets.AriaLib"
    },
    templateSettings: {
      allowSectionAsContainers: false,
      escapeHtmlByDefault: true
    }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function checkApplicationSettings(name: string): any {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (applicationSettings as any)[name] ? undefined :  (applicationSettings as any)[name];
}
