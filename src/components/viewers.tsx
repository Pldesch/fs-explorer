import { DownloadIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { FileTypeIcon } from "@/components/file-icon"
import { extensionOf, rawFileUrl } from "@/lib/file-kinds"

export function PdfViewer({ path }: { path: string }) {
  return (
    <iframe
      src={rawFileUrl(path)}
      title={path}
      className="h-[78vh] w-full rounded-lg shadow-sm"
    />
  )
}

export function ImageViewer({ path }: { path: string }) {
  return (
    <img
      src={rawFileUrl(path)}
      alt={path}
      className="max-h-[78vh] rounded-lg shadow-sm"
    />
  )
}

export function UnsupportedViewer({
  path,
  name,
}: {
  path: string
  name: string
}) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <FileTypeIcon name={name} type="file" />
        </EmptyMedia>
        <EmptyTitle>No preview for “.{extensionOf(name)}” files</EmptyTitle>
        <EmptyDescription>
          This file type can’t be shown here, but you can download it and open
          it on your computer.
        </EmptyDescription>
      </EmptyHeader>
      <Button asChild>
        <a href={rawFileUrl(path, true)}>
          <DownloadIcon data-icon="inline-start" />
          Download file
        </a>
      </Button>
    </Empty>
  )
}
