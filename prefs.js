"use strict";

import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class NextUpExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    // Use the same GSettings schema as in `extension.js`
    const settings = this.getSettings();

    // Create a preferences page and group
    const page = new Adw.PreferencesPage();
    const group = new Adw.PreferencesGroup();
    page.add(group);

    // Create a new preferences row
    const row = new Adw.ActionRow({ title: "Panel to show indicator in" });
    group.add(row);

    const dropdown = new Gtk.DropDown({
      model: Gtk.StringList.new(["Left", "Center", "Right"]),
      valign: Gtk.Align.CENTER,
    });

    settings.bind(
      "which-panel",
      dropdown,
      "selected",
      Gio.SettingsBindFlags.DEFAULT
    );

    row.add_suffix(dropdown);
    row.activatable_widget = dropdown;

    const textRow = new Adw.ActionRow({ title: "Show current event in indicator text" });
    group.add(textRow);

    const textDropdown = new Gtk.DropDown({
      model: Gtk.StringList.new(["Don't show (old)", "Show"]),
      valign: Gtk.Align.CENTER,
    });

    settings.bind(
      "text-format",
      textDropdown,
      "selected",
      Gio.SettingsBindFlags.DEFAULT
    );

    textRow.add_suffix(textDropdown);
    textRow.activatable_widget = textDropdown;

    // Add our page to the window
    window.add(page);
  }
}
