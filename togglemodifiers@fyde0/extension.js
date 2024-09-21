import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const modifiers = {
    ctrl: {
        key: "Ctrl",
        iconKeyDown: "window-close-symbolic",
        iconKeyUp: "go-bottom-symbolic",
        commandDown: ["/bin/bash", "-c", "echo keydown leftctrl | dotoolc"],
        commandUp: ["/bin/bash", "-c", "echo keyup leftctrl | dotoolc"]
    },
    shift: {
        key: "Shift",
        iconKeyDown: "window-close-symbolic",
        iconKeyUp: "go-up-symbolic",
        commandDown: ["/bin/bash", "-c", "echo keydown leftshift | dotoolc"],
        commandUp: ["/bin/bash", "-c", "echo keyup leftshift | dotoolc"]
    }
}

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init(modifier) {
            super._init(0.0, _("Toggle " + modifiers[modifier].key))
            this.modifier = modifier
            this.active = false

            this._icon = new St.Icon({
                icon_name: modifiers[this.modifier].iconKeyUp,
                style_class: "system-status-icon",
            })

            this.add_child(this._icon)

            this.connect("event", this._onClicked.bind(this))
        }

        _onClicked(actor, event) {
            // I don't remember why this is necessary but it should probably stay
            if ((event.type() !== Clutter.EventType.TOUCH_BEGIN && event.type() !== Clutter.EventType.BUTTON_PRESS)) {
                return Clutter.EVENT_PROPAGATE
            }

            // toggle modifier status
            this.active = !this.active

            // run command
            if (this.active) {
                this._subprocess(modifiers[this.modifier].commandDown)
                this._icon.icon_name = modifiers[this.modifier].iconKeyDown
            } else {
                this._subprocess(modifiers[this.modifier].commandUp)
                this._icon.icon_name = modifiers[this.modifier].iconKeyUp
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

        // buttons container
        this._box = new St.BoxLayout({ name: "modifiersBox" })
        Main.panel.add_child(this._box)

        // set padding
        // const style = "-minimum-hpadding: 1px; -natural-hpadding: 1px;"
        const style = ""

        // create button
        this._ctrlIndicator = new Indicator("ctrl")
        // get current style and add padding to it
        const ctrlStyle = this._ctrlIndicator.get_style()
        this._ctrlIndicator.set_style(style + " " + ctrlStyle)
        // refresh to apply style
        this._refreshActor(this._ctrlIndicator)

        this._shiftIndicator = new Indicator("shift")
        const shiftStyle = this._shiftIndicator.get_style()
        this._shiftIndicator.set_style(style + " " + shiftStyle)
        this._refreshActor(this._shiftIndicator)

        // bind button visibility to settings switch
        this._settings.bind("show-ctrl", this._ctrlIndicator, "visible",
            Gio.SettingsBindFlags.DEFAULT);

        // add to bar
        // (id, thing to add, position, container)
        Main.panel.addToStatusArea(this.uuid + "-ctrl", this._ctrlIndicator, 0, this._box)
        Main.panel.addToStatusArea(this.uuid + "-shift", this._shiftIndicator, 1, this._box)
    }

    disable() {
        this._ctrlIndicator.destroy()
        this._ctrlIndicator = null
        this._shiftIndicator.destroy()
        this._shiftIndicator = null
        this._box.destroy()
        this._box = null
    }
}
