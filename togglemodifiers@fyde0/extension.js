import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const modifiers = {
    ctrl: {
        key: "ctrl",
        iconKeyDown: "cross-symbolic",
        iconKeyUp: "ctrl-symbolic",
        commandDown: ["/bin/bash", "-c", "echo keydown leftctrl | dotoolc"],
        commandUp: ["/bin/bash", "-c", "echo keyup leftctrl | dotoolc"]
    },
    shift: {
        key: "shift",
        iconKeyDown: "cross-symbolic",
        iconKeyUp: "shift-symbolic",
        commandDown: ["/bin/bash", "-c", "echo keydown leftshift | dotoolc"],
        commandUp: ["/bin/bash", "-c", "echo keyup leftshift | dotoolc"]
    },
    alt: {
        key: "alt",
        iconKeyDown: "cross-symbolic",
        iconKeyUp: "alt-symbolic",
        commandDown: ["/bin/bash", "-c", "echo keydown leftalt | dotoolc"],
        commandUp: ["/bin/bash", "-c", "echo keyup leftalt | dotoolc"]
    }
}

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init(modifier, path) {
            // First letter uppercase
            super._init(0.0, _("Toggle " + modifier.key.charAt(0).toUpperCase() + modifier.key.slice(1)))
            // modifier object from modifiers array
            this.modifier = modifier
            // extension path for icons
            this._path = path
            // toggle status
            this.active = false

            this._icon = new St.Icon({
                gicon: Gio.icon_new_for_string(this._path + "/icons/" + this.modifier.iconKeyUp + ".svg"),
                style_class: "system-status-icon",
            })
            this.add_child(this._icon)

            // bind to _onClicked function
            this.connect("event", this._onClicked.bind(this))
        }

        _onClicked(actor, event) {
            // I don't remember why this is necessary but it should probably stay
            if ((event.type() !== Clutter.EventType.TOUCH_BEGIN && event.type() !== Clutter.EventType.BUTTON_PRESS)) {
                return Clutter.EVENT_PROPAGATE
            }

            // toggle modifier status
            this.active = !this.active

            // run command and change icon
            if (this.active) {
                this._subprocess(this.modifier.commandDown)
                this._icon.gicon = Gio.icon_new_for_string(this._path + "/icons/" + this.modifier.iconKeyDown + ".svg")
            } else {
                this._subprocess(this.modifier.commandUp)
                this._icon.gicon = Gio.icon_new_for_string(this._path + "/icons/" + this.modifier.iconKeyUp + ".svg")
            }

            return Clutter.EVENT_PROPAGATE
        }

        _subprocess(command) {
            try {
                Gio.Subprocess.new(command, Gio.SubprocessFlags.NONE)
            } catch (e) {
                Main.notify("Toggle error.")
            }
        }
    })

export default class ToggleModifier extends Extension {

    // needed for applying css
    // https://gitlab.com/p91paul/status-area-horizontal-spacing-gnome-shell-extension/-/blob/95391c9d1d51b8df1082794ee584d931a2c3610f/status-area-horizontal-spacing@mathematical.coffee.gmail.com/extension.js
    _refreshActor(actor) {
        let oldClass = actor.get_style_class_name();
        actor.set_style_class_name('dummy-class-unlikely-to-exist-status-area-horizontal-spacing');
        actor.set_style_class_name(oldClass);
    }

    enable() {

        // load settings
        this._settings = this.getSettings()
        const padding = this._settings.get_int("padding")

        // buttons container
        this._box = new St.BoxLayout({ name: "modifiersBox" })
        Main.panel.add_child(this._box)

        // set padding
        const style = "-minimum-hpadding: " + padding + "px; -natural-hpadding: " + padding + "px;"
        // const style = ""

        // ctrl
        // create button
        this._ctrlIndicator = new Indicator(modifiers.ctrl, this.path)
        // get current style and add padding to it
        const ctrlStyle = this._ctrlIndicator.get_style()
        this._ctrlIndicator.set_style(style + " " + ctrlStyle)
        // refresh to apply style
        this._refreshActor(this._ctrlIndicator)
        // bind button visibility to settings
        this._settings.bind("show-ctrl", this._ctrlIndicator,
            "visible", Gio.SettingsBindFlags.DEFAULT)
        // add button to top bar (inside box)
        // (id, object to add, position, container)
        Main.panel.addToStatusArea(this.uuid + "-ctrl", this._ctrlIndicator, 0, this._box)

        // shift
        this._shiftIndicator = new Indicator(modifiers.shift, this.path)
        const shiftStyle = this._shiftIndicator.get_style()
        this._shiftIndicator.set_style(style + " " + shiftStyle)
        this._refreshActor(this._shiftIndicator)
        this._settings.bind("show-shift", this._shiftIndicator,
            "visible", Gio.SettingsBindFlags.DEFAULT)
        Main.panel.addToStatusArea(this.uuid + "-shift", this._shiftIndicator, 1, this._box)

        // alt
        this._altIndicator = new Indicator(modifiers.alt, this.path)
        const altStyle = this._altIndicator.get_style()
        this._altIndicator.set_style(style + " " + altStyle)
        this._refreshActor(this._altIndicator)
        this._settings.bind("show-alt", this._altIndicator,
            "visible", Gio.SettingsBindFlags.DEFAULT)
        Main.panel.addToStatusArea(this.uuid + "-alt", this._altIndicator, 2, this._box)
    }

    disable() {
        if (this._ctrlIndicator !== null) {
            this._ctrlIndicator.destroy()
            this._ctrlIndicator = null
        }
        if (this._shiftIndicator !== null) {
            this._shiftIndicator.destroy()
            this._shiftIndicator = null
        }
        if (this._altIndicator !== null) {
            this._altIndicator.destroy()
            this._altIndicator = null
        }
        if (this._box !== null) {
            this._box.destroy()
            this._box = null
        }
        this._settings = null
    }
}
