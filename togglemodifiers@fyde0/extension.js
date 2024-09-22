import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import St from 'gi://St';
import Gio from 'gi://Gio';

import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

const modifiers = [
    {
        key: "ctrl",
        iconKeyDown: "window-close-symbolic",
        iconKeyUp: "go-bottom-symbolic",
        commandDown: ["/bin/bash", "-c", "echo keydown leftctrl | dotoolc"],
        commandUp: ["/bin/bash", "-c", "echo keyup leftctrl | dotoolc"]
    },
    {
        key: "shift",
        iconKeyDown: "window-close-symbolic",
        iconKeyUp: "go-up-symbolic",
        commandDown: ["/bin/bash", "-c", "echo keydown leftshift | dotoolc"],
        commandUp: ["/bin/bash", "-c", "echo keyup leftshift | dotoolc"]
    },
    {
        key: "alt",
        iconKeyDown: "window-close-symbolic",
        iconKeyUp: "go-next-symbolic",
        commandDown: ["/bin/bash", "-c", "echo keydown leftalt | dotoolc"],
        commandUp: ["/bin/bash", "-c", "echo keyup leftalt | dotoolc"]
    }
]

const Indicator = GObject.registerClass(
    class Indicator extends PanelMenu.Button {
        _init(modifier) {
            // First letter uppercase
            super._init(0.0, _("Toggle " + modifier.key.charAt(0).toUpperCase() + modifier.key.slice(1)))
            // modifier object from modifiers array
            this.modifier = modifier
            // toggle status
            this.active = false

            this._icon = new St.Icon({
                icon_name: this.modifier.iconKeyUp,
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
                this._icon.icon_name = this.modifier.iconKeyDown
            } else {
                this._subprocess(this.modifier.commandUp)
                this._icon.icon_name = this.modifier.iconKeyUp
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

        this._indicators = []
        modifiers.forEach((modifier, i) => {
            // create button
            this._indicators[modifier.key] = new Indicator(modifier)
            // get current style and add padding to it
            const ctrlStyle = this._indicators[modifier.key].get_style()
            this._indicators[modifier.key].set_style(style + " " + ctrlStyle)
            // refresh to apply style
            this._refreshActor(this._indicators[modifier.key])
            // bind button visibility to settings
            this._settings.bind("show-" + modifier.key, this._indicators[modifier.key],
                "visible", Gio.SettingsBindFlags.DEFAULT)
            // add button to top bar (inside box)
            // (id, object to add, position, container)
            Main.panel.addToStatusArea(this.uuid + "-" + modifier.key, this._indicators[modifier.key], i, this._box)
        })
    }

    disable() {
        this._box.destroy()
        this._box = null
    }
}
