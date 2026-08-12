/*
 * Keyword (BM25) retrieval as an alternative and complement to embeddings.
 *
 * [retrieval] on ml_types decides how get-context finds snippets for a type:
 * 'embeddings' (default, cosine distance over vectors), 'bm25' (FTS5 keyword
 * search, needing no OpenAI key at all), or 'mixed' (both, merged with
 * reciprocal rank fusion).
 *
 * The FTS5 index is an external-content table over ml_training_snippets, kept
 * in sync by triggers, so keyword search needs no vectorise step - snippets
 * are searchable the moment they are created.
 *
 * Notice, this script runs on every startup and the runner ignores failures
 * per script: on re-runs the alter table below fails since the column already
 * exists, which aborts the rest of the file - deliberately, since everything
 * after it already exists too, and the rebuild only needs to run once.
 */
alter table ml_types add column retrieval text not null default 'embeddings';

create virtual table if not exists ml_training_snippets_fts using fts5(
   prompt,
   completion,
   content='ml_training_snippets',
   content_rowid='id');

create trigger if not exists ml_training_snippets_fts_ai after insert on ml_training_snippets begin
   insert into ml_training_snippets_fts (rowid, prompt, completion) values (new.id, new.prompt, new.completion);
end;

create trigger if not exists ml_training_snippets_fts_ad after delete on ml_training_snippets begin
   insert into ml_training_snippets_fts (ml_training_snippets_fts, rowid, prompt, completion) values ('delete', old.id, old.prompt, old.completion);
end;

create trigger if not exists ml_training_snippets_fts_au after update on ml_training_snippets begin
   insert into ml_training_snippets_fts (ml_training_snippets_fts, rowid, prompt, completion) values ('delete', old.id, old.prompt, old.completion);
   insert into ml_training_snippets_fts (rowid, prompt, completion) values (new.id, new.prompt, new.completion);
end;

/*
 * Indexing snippets that existed before the triggers did.
 */
insert into ml_training_snippets_fts (ml_training_snippets_fts) values ('rebuild');
