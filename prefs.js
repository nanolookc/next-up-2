"use strict";

import Adw from "gi://Adw";
import Gio from "gi://Gio";
import Gtk from "gi://Gtk";
import Gdk from "gi://Gdk";

import {
  ExtensionPreferences,
  gettext as _,
} from "resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js";

export default class NextUpExtensionPreferences extends ExtensionPreferences {
  fillPreferencesWindow(window) {
    const settings = this.getSettings();
    const page = new Adw.PreferencesPage();
    window.add(page);

    // ==========================================
    // GROUP 1: General Layout & Text
    // ==========================================
    const groupGeneral = new Adw.PreferencesGroup({ title: _("General Layout & Text") });
    page.add(groupGeneral);

    // Original: Show current event in text
    const textRow = new Adw.ActionRow({ title: _("Show current event in indicator text") });
    const textDropdown = new Gtk.DropDown({
      model: Gtk.StringList.new([_("Don't show (old)"), _("Show")]),
      valign: Gtk.Align.CENTER,
    });
    settings.bind("text-format", textDropdown, "selected", Gio.SettingsBindFlags.DEFAULT);
    textRow.add_suffix(textDropdown);
    textRow.activatable_widget = textDropdown;
    groupGeneral.add(textRow);

    // Layout Style Dropdown
    const layoutRow = new Adw.ActionRow({ title: _("Layout Style") });
    const layoutDropdown = new Gtk.DropDown({
      model: Gtk.StringList.new([_("Default"), _("Minimal (Short Text)")]),
      valign: Gtk.Align.CENTER,
    });
    settings.bind("layout-style", layoutDropdown, "selected", Gio.SettingsBindFlags.DEFAULT);
    layoutRow.add_suffix(layoutDropdown);
    layoutRow.activatable_widget = layoutDropdown;
    groupGeneral.add(layoutRow);

    // New: Done Text
    const doneTextRow = new Adw.EntryRow({ title: _("Done for the day text") });
    settings.bind("done-text", doneTextRow, "text", Gio.SettingsBindFlags.DEFAULT);
    groupGeneral.add(doneTextRow);

    // New: Excluded Keywords
    const excludedRow = new Adw.EntryRow({
      title: _("Excluded Keywords (Comma-separated)"),
    });
    settings.bind("excluded-keywords", excludedRow, "text", Gio.SettingsBindFlags.DEFAULT);
    groupGeneral.add(excludedRow);

    // ==========================================
    // GROUP 2: Countdown Progress
    // ==========================================
    const groupVisual = new Adw.PreferencesGroup({
      title: _("Countdown Progress"),
      description: _(
        "The bar fills during the final hour before the next event starts, or before the current event ends."
      ),
    });
    page.add(groupVisual);

    const addColorPicker = (key, title) => {
      const row = new Adw.ActionRow({ title });
      const rgba = new Gdk.RGBA();
      rgba.parse(settings.get_string(key));

      const colorButton = new Gtk.ColorButton({
        rgba,
        use_alpha: false,
        valign: Gtk.Align.CENTER,
      });
      colorButton.connect("notify::rgba", () => {
        settings.set_string(key, colorButton.get_rgba().to_string());
      });

      row.add_suffix(colorButton);
      row.activatable_widget = colorButton;
      groupVisual.add(row);
    };

    addColorPicker("progress-green-color", _("31 to 60 minutes"));
    addColorPicker("progress-yellow-color", _("11 to 30 minutes"));
    addColorPicker("progress-red-color", _("0 to 10 minutes"));

    const progressWindowRow = new Adw.ActionRow({
      title: _("Progress window"),
      subtitle: _("Minutes remaining"),
    });
    const progressWindowSpin = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 1,
        upper: 240,
        step_increment: 1,
      }),
      valign: Gtk.Align.CENTER,
    });
    settings.bind(
      "progress-orange-threshold",
      progressWindowSpin,
      "value",
      Gio.SettingsBindFlags.DEFAULT
    );
    progressWindowRow.add_suffix(progressWindowSpin);
    groupVisual.add(progressWindowRow);

    const yellowThresholdRow = new Adw.ActionRow({
      title: _("Yellow threshold"),
      subtitle: _("Minutes remaining"),
    });
    const yellowThresholdSpin = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 120,
        step_increment: 1,
      }),
      valign: Gtk.Align.CENTER,
    });
    settings.bind(
      "progress-yellow-threshold",
      yellowThresholdSpin,
      "value",
      Gio.SettingsBindFlags.DEFAULT
    );
    yellowThresholdRow.add_suffix(yellowThresholdSpin);
    groupVisual.add(yellowThresholdRow);

    const redThresholdRow = new Adw.ActionRow({
      title: _("Red threshold"),
      subtitle: _("Minutes remaining"),
    });
    const redThresholdSpin = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({
        lower: 0,
        upper: 60,
        step_increment: 1,
      }),
      valign: Gtk.Align.CENTER,
    });
    settings.bind(
      "progress-red-threshold",
      redThresholdSpin,
      "value",
      Gio.SettingsBindFlags.DEFAULT
    );
    redThresholdRow.add_suffix(redThresholdSpin);
    groupVisual.add(redThresholdRow);

    // ==========================================
    // GROUP 3: Behavior & Toggles
    // ==========================================
    const groupBehavior = new Adw.PreferencesGroup({ title: _("Behavior") });
    page.add(groupBehavior);

    // Original: Show all-day events
    const allDayRow = new Adw.SwitchRow({
      title: _("Show all-day events"),
      subtitle: _("Include events without a specific time"),
    });
    settings.bind("show-all-day-events", allDayRow, "active", Gio.SettingsBindFlags.DEFAULT);
    groupBehavior.add(allDayRow);

    // Toggle for party popper icon when done for the day
    const confettiRow = new Adw.SwitchRow({
      title: _("Show Party Popper Icon"),
      subtitle: _("Display icon when done for the day")
    });
    settings.bind("show-confetti-icon", confettiRow, "active", Gio.SettingsBindFlags.DEFAULT);
    groupBehavior.add(confettiRow);

    // Hide next when active
    const hideNextRow = new Adw.SwitchRow({
      title: _("Hide next event when active"),
      subtitle: _("Only show the ongoing event")
    });
    settings.bind("hide-next-when-active", hideNextRow, "active", Gio.SettingsBindFlags.DEFAULT);
    groupBehavior.add(hideNextRow);

    // Early completion
    const earlyCompRow = new Adw.SwitchRow({
      title: _("Enable Early Completion"),
      subtitle: _("Allow dismissing an active event early")
    });
    settings.bind("enable-early-completion", earlyCompRow, "active", Gio.SettingsBindFlags.DEFAULT);
    groupBehavior.add(earlyCompRow);
  }
}
