import { useState } from 'react'
import { addTags, MAX_TAG_LENGTH, removeTag, suggestTags } from '../clips/tags'

type Props = {
  tags: readonly string[]
  allTags: readonly string[]
  onChange: (tags: string[]) => void
}

/**
 * タグの追加と削除。入力中の文字列に合う既存タグを候補として出す。
 * iOS Safari の <datalist> は候補の出方が不安定なため、候補はボタンで並べている。
 */
export function TagEditor({ tags, allTags, onChange }: Props) {
  const [draft, setDraft] = useState('')
  const suggestions = suggestTags(allTags, tags, draft)

  const commit = (input: string) => {
    const next = addTags(tags, input)
    if (next.length !== tags.length) onChange(next)
    setDraft('')
  }

  return (
    <div className="tag-editor">
      {tags.length > 0 && (
        <ul className="tag-list">
          {tags.map((tag) => (
            <li key={tag} className="tag">
              #{tag}
              <button
                type="button"
                className="tag-remove"
                aria-label={`タグ「${tag}」を外す`}
                onClick={() => onChange(removeTag(tags, tag))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
      <form
        className="tag-form"
        onSubmit={(event) => {
          event.preventDefault()
          commit(draft)
        }}
      >
        <input
          className="tag-input"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="タグを追加（「、」で複数）"
          aria-label="タグを追加"
          maxLength={MAX_TAG_LENGTH * 4}
          enterKeyHint="done"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <button type="submit" className="tag-add" disabled={draft.trim() === ''}>
          追加
        </button>
      </form>
      {suggestions.length > 0 && (
        <div className="chip-row wrap" aria-label="既存のタグ">
          {suggestions.map((tag) => (
            <button key={tag} type="button" className="chip chip-tag" onClick={() => commit(tag)}>
              #{tag}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
