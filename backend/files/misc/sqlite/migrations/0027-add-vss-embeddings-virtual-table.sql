
create virtual table vss_ml_training_snippets using vss0(
  embedding_vss(384) factory="PCA4,Flat,IDMap2",
  constraint vss_ml_training_snippets_ml_training_snippets_fky foreign key (rowid) references ml_training_snippets (id) on delete cascade
);
