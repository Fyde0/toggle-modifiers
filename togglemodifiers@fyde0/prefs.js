import Gio from 'gi://Gio';
import Adw from 'gi://Adw';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class ToggleModifierPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // preferences page, I'm not sure where this text is
        const page = new Adw.PreferencesPage({
            title: _("General"),
            icon_name: "dialog-information-symbolic",
        })
        window.add(page)

        // prefs group, toggle modifiers
        const modsGroup = new Adw.PreferencesGroup({
            title: _("Modifiers"),
            description: _("Choose which modifiers toggle buttons to show"),
        })
        page.add(modsGroup)

        const ctrlSwitch = new Adw.SwitchRow({
            title: _('Show Ctrl button'),
            subtitle: _('Whether to show the Ctrl toggle button'),
        })
        modsGroup.add(ctrlSwitch)

        // bind to XML key
        window._settings = this.getSettings()
        window._settings.bind("show-ctrl", ctrlSwitch, "active", Gio.SettingsBindFlags.DEFAULT)
    }
}