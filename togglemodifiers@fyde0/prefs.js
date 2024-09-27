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
            description: _("Choose which modifiers to show"),
        })
        page.add(modsGroup)

        // ctrl switch
        const ctrlSwitch = new Adw.SwitchRow({
            title: _("Show Ctrl button")
        })
        // add to group
        modsGroup.add(ctrlSwitch)
        // bind to XML key in schema
        window._settings = this.getSettings()
        window._settings.bind("show-ctrl", ctrlSwitch, "active", Gio.SettingsBindFlags.DEFAULT)

        // shift switch
        const shiftSwitch = new Adw.SwitchRow({
            title: _("Show Shift button")
        })
        modsGroup.add(shiftSwitch)
        window._settings = this.getSettings()
        window._settings.bind("show-shift", shiftSwitch, "active", Gio.SettingsBindFlags.DEFAULT)

        // alt switch
        const altSwitch = new Adw.SwitchRow({
            title: _("Show Alt button")
        })
        modsGroup.add(altSwitch)
        window._settings = this.getSettings()
        window._settings.bind("show-alt", altSwitch, "active", Gio.SettingsBindFlags.DEFAULT)

        // style group
        const styleGroup = new Adw.PreferencesGroup({
            title: _("Style"),
            description: _("Re-enable extension to apply"),
        })
        page.add(styleGroup)

        // padding
        // min value, max value, step
        const paddingField = Adw.SpinRow.new_with_range(0, 32, 1)
        paddingField.set_title("Spacing between buttons")
        styleGroup.add(paddingField)
        window._settings = this.getSettings()
        window._settings.bind("padding", paddingField, "value", Gio.SettingsBindFlags.DEFAULT)
    }
}