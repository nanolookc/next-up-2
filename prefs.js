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

    // Original: Panel to show indicator
    const panelRow = new Adw.ActionRow({ title: _("Panel to show indicator in") });
    const dropdown = new Gtk.DropDown({
      model: Gtk.StringList.new([_("Left"), _("Center"), _("Right")]),
      valign: Gtk.Align.CENTER,
    });
    settings.bind("which-panel", dropdown, "selected", Gio.SettingsBindFlags.DEFAULT);
    panelRow.add_suffix(dropdown);
    panelRow.activatable_widget = dropdown;
    groupGeneral.add(panelRow);

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

    // New: Max Width
    const maxWidthRow = new Adw.ActionRow({
      title: _("Maximum Indicator Width"),
      subtitle: _("Pixels before text truncates")
    });
    const maxWidthSpin = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({ lower: 50, upper: 1000, step_increment: 10 }),
      valign: Gtk.Align.CENTER
    });
    settings.bind("max-width", maxWidthSpin, "value", Gio.SettingsBindFlags.DEFAULT);
    maxWidthRow.add_suffix(maxWidthSpin);
    groupGeneral.add(maxWidthRow);

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
    // GROUP 2: Visuals & Colors
    // ==========================================
    const groupVisual = new Adw.PreferencesGroup({ title: _("Visuals & Colors") });
    page.add(groupVisual);

    // Helper function to create native color pickers
    const addColorPicker = (key, title) => {
      const row = new Adw.ActionRow({ title: title });
      
      // Convert the saved string (e.g. '#ff0000') into a GNOME color object
      const rgba = new Gdk.RGBA();
      rgba.parse(settings.get_string(key));
      
      const colorBtn = new Gtk.ColorButton({
        rgba: rgba,
        use_alpha: true, // Allows transparency
        valign: Gtk.Align.CENTER
      });

      // When the user clicks "Select" in the color window, save it back as a string
      colorBtn.connect('notify::rgba', () => {
        settings.set_string(key, colorBtn.get_rgba().to_string());
      });

      row.add_suffix(colorBtn);
      row.activatable_widget = colorBtn;
      groupVisual.add(row);
    };

    // Add our three beautiful new native color pickers
    addColorPicker("active-bg-color", _("Active Event Background Color"));
    addColorPicker("warning-color", _("Warning Color (Before event starts)"));
    addColorPicker("urgency-color", _("Urgency Color (Before event ends)"));

    const warningThreshRow = new Adw.ActionRow({ title: _("Warning Threshold (Minutes before start)") });
    const warningSpin = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({ lower: 0, upper: 120, step_increment: 1 }),
      valign: Gtk.Align.CENTER
    });
    settings.bind("warning-threshold", warningSpin, "value", Gio.SettingsBindFlags.DEFAULT);
    warningThreshRow.add_suffix(warningSpin);
    groupVisual.add(warningThreshRow);

    const urgencyThreshRow = new Adw.ActionRow({ title: _("Urgency Threshold (Minutes before end)") });
    const urgencySpin = new Gtk.SpinButton({
      adjustment: new Gtk.Adjustment({ lower: 0, upper: 60, step_increment: 1 }),
      valign: Gtk.Align.CENTER
    });
    settings.bind("urgency-threshold", urgencySpin, "value", Gio.SettingsBindFlags.DEFAULT);
    urgencyThreshRow.add_suffix(urgencySpin);
    groupVisual.add(urgencyThreshRow);

    // // Active Event BG Color
    // const activeBgRow = new Adw.EntryRow({
    //   title: _("Active Event Background Color"),
    // });
    // settings.bind("active-bg-color", activeBgRow, "text", Gio.SettingsBindFlags.DEFAULT);
    // groupVisual.add(activeBgRow);

    // // Warning Color
    // const warningColorRow = new Adw.EntryRow({
    //   title: _("Warning Color (Before Event Starts)"),
    // });
    // settings.bind("warning-color", warningColorRow, "text", Gio.SettingsBindFlags.DEFAULT);
    // groupVisual.add(warningColorRow);

    // // Warning Threshold
    // const warningThreshRow = new Adw.ActionRow({ title: _("Warning Threshold (Minutes Before Start)") });
    // const warningSpin = new Gtk.SpinButton({
    //   adjustment: new Gtk.Adjustment({ lower: 0, upper: 120, step_increment: 1 }),
    //   valign: Gtk.Align.CENTER
    // });
    // settings.bind("warning-threshold", warningSpin, "value", Gio.SettingsBindFlags.DEFAULT);
    // warningThreshRow.add_suffix(warningSpin);
    // groupVisual.add(warningThreshRow);

    // // Urgency Color (Before End)
    // const urgencyColorRow = new Adw.EntryRow({
    //   title: _("Urgency Color (Before Event Ends)"),
    // });
    // settings.bind("urgency-color", urgencyColorRow, "text", Gio.SettingsBindFlags.DEFAULT);
    // groupVisual.add(urgencyColorRow);

    // // Urgency Threshold
    // const urgencyThreshRow = new Adw.ActionRow({ title: _("Urgency Threshold (Minutes Before End)") });
    // const urgencySpin = new Gtk.SpinButton({
    //   adjustment: new Gtk.Adjustment({ lower: 0, upper: 60, step_increment: 1 }),
    //   valign: Gtk.Align.CENTER
    // });
    // settings.bind("urgency-threshold", urgencySpin, "value", Gio.SettingsBindFlags.DEFAULT);
    // urgencyThreshRow.add_suffix(urgencySpin);
    // groupVisual.add(urgencyThreshRow);

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
