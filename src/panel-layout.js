import GLib from "gi://GLib";

import * as Main from "resource:///org/gnome/shell/ui/main.js";

import { computeLeftIndicatorWidth } from "./panel-geometry.js";

export default class PanelLayout {
  constructor(indicatorContainer) {
    this._indicatorContainer = indicatorContainer;
    this._signalIds = [];
    this._updateSourceId = null;
    this._attached = false;
  }

  attach() {
    if (this._attached) {
      return;
    }

    const parent = this._indicatorContainer.get_parent();
    if (parent) {
      parent.remove_child(this._indicatorContainer);
    }

    this._indicatorContainer.x_expand = true;
    Main.panel._leftBox.insert_child_at_index(this._indicatorContainer, 1);

    this._signalIds = [
      [
        Main.panel,
        Main.panel.connect("notify::allocation", () => this._queueUpdate()),
      ],
      [
        Main.panel._centerBox,
        Main.panel._centerBox.connect("notify::allocation", () =>
          this._queueUpdate()
        ),
      ],
      [
        Main.panel._leftBox,
        Main.panel._leftBox.connect("child-added", () => this._queueUpdate()),
      ],
      [
        Main.panel._leftBox,
        Main.panel._leftBox.connect("child-removed", () => this._queueUpdate()),
      ],
    ];

    this._attached = true;
    this._queueUpdate();
  }

  detach() {
    if (!this._attached) {
      return;
    }

    if (this._updateSourceId !== null) {
      GLib.Source.remove(this._updateSourceId);
      this._updateSourceId = null;
    }

    for (const [actor, signalId] of this._signalIds) {
      actor.disconnect(signalId);
    }
    this._signalIds = [];

    const parent = this._indicatorContainer.get_parent();
    if (parent) {
      parent.remove_child(this._indicatorContainer);
    }

    this._indicatorContainer.set_width(-1);
    this._indicatorContainer.x_expand = false;
    this._attached = false;
  }

  _queueUpdate() {
    if (!this._attached || this._updateSourceId !== null) {
      return;
    }

    this._updateSourceId = GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE, () => {
      this._updateSourceId = null;
      this._updateWidth();
      return GLib.SOURCE_REMOVE;
    });
  }

  _updateWidth() {
    if (!this._attached) {
      return;
    }

    const panelWidth = Main.panel.get_width();
    const [, centerWidth] = Main.panel._centerBox.get_preferred_width(-1);
    const [, leftNaturalWidth] = Main.panel._leftBox.get_preferred_width(-1);
    const [, indicatorNaturalWidth] =
      this._indicatorContainer.get_preferred_width(-1);
    const occupiedLeftWidth = Math.max(
      0,
      leftNaturalWidth - indicatorNaturalWidth
    );

    // Keep GNOME's center box on the physical panel midpoint. Work areas can
    // be asymmetric when a dock reserves space on only one side.
    const width = computeLeftIndicatorWidth(
      panelWidth,
      centerWidth,
      occupiedLeftWidth
    );

    if (this._indicatorContainer.get_width() !== width) {
      this._indicatorContainer.set_width(width);
    }
  }
}
