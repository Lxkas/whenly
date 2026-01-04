"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HugeiconsIcon } from "@hugeicons/react";
import { Copy01Icon, Tick01Icon } from "@hugeicons/core-free-icons";

interface CopyLinkButtonProps {
	slug: string;
}

export function CopyLinkButton({ slug }: CopyLinkButtonProps) {
	const [copied, setCopied] = useState(false);

	const handleCopy = async () => {
		const url = `${window.location.origin}/e/${slug}`;
		await navigator.clipboard.writeText(url);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button variant="outline" size="sm" onClick={handleCopy}>
						{copied ? (
							<>
								<HugeiconsIcon icon={Tick01Icon} className="mr-2 size-4" />
								Copied!
							</>
						) : (
							<>
								<HugeiconsIcon icon={Copy01Icon} className="mr-2 size-4" />
								Copy Link
							</>
						)}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Share this link with others</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
