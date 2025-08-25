
/*
 * Dropping old virtual VSS table(s).
 */
drop table vss_ml_training_snippets;

/*
 * Creating embeddings column for embeddings.
 */
alter table ml_training_snippets add column embeddings BLOB;

