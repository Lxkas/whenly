"use client";

import { useState, useEffect } from "react";

/**
 * Detects if the user is on a touch-primary device (mobile/tablet).
 * Returns true for touch devices, false for mouse/keyboard devices.
 * Uses a combination of media queries and touch event detection.
 */
export function useTouchDevice() {
	const [isTouchDevice, setIsTouchDevice] = useState(false);

	useEffect(() => {
		// check for touch capability and if it's the primary input
		const checkTouchDevice = () => {
			// coarse pointer = finger/touch, fine pointer = mouse
			const hasCoarsePointer = window.matchMedia("(pointer: coarse)").matches;
			// also check if touch events are available
			const hasTouchEvents = "ontouchstart" in window || navigator.maxTouchPoints > 0;

			// consider it a touch device if it has coarse pointer OR touch events and no fine pointer
			const hasFinePointer = window.matchMedia("(pointer: fine)").matches;

			// if device has both (like laptops with touchscreen), prefer mouse behavior
			// only treat as touch device if coarse is primary and no fine pointer
			setIsTouchDevice(hasCoarsePointer && !hasFinePointer && hasTouchEvents);
		};

		checkTouchDevice();

		// listen for changes (e.g., connecting/disconnecting mouse)
		const mediaQuery = window.matchMedia("(pointer: coarse)");
		const handleChange = () => checkTouchDevice();

		mediaQuery.addEventListener("change", handleChange);
		return () => mediaQuery.removeEventListener("change", handleChange);
	}, []);

	return isTouchDevice;
}
