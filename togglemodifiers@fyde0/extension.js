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

            this.active = !this.active

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
                Main.notify('Toggle error.')
            }
        }
    })

export default class ToggleModifier extends Extension {
    enable() {
        this._ctrlIndicator = new Indicator("ctrl")
        this._shiftIndicator = new Indicator("shift")
        Main.panel.addToStatusArea(this.uuid + "-ctrl", this._ctrlIndicator)
        Main.panel.addToStatusArea(this.uuid + "-shift", this._shiftIndicator)
    }

    disable() {
        this._ctrlIndicator.destroy()
        this._ctrlIndicator = null
        this._shiftIndicator.destroy()
        this._shiftIndicator = null
    }
}
