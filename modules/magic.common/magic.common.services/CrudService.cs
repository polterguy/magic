/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

using System;
using System.Linq;
using System.Collections.Generic;
using log4net;
using NHibernate;
using magic.common.model;
using magic.common.contracts;

namespace magic.common.services
{
    public abstract class CrudService<DbModel> : ICrudService<DbModel> where DbModel : Model
    {
        readonly protected ISession Session;
        readonly protected ILog Logger;

        public CrudService(ISession session)
        {
            Session = session ?? throw new ArgumentNullException(nameof(session));
            Logger = LogManager.GetLogger(this.GetType());
        }

        public virtual Guid Save(DbModel model)
        {
            if (model.Id == Guid.Empty)
            {
                Session.Save(model);
            }
            else
            {
                var existing = Session.Load<DbModel>(model.Id);
                if (existing == null)
                    throw new ArgumentException($"{nameof(DbModel)} with id of '{model.Id}' doesn't exist");
                Session.Merge(model);
            }
            Session.Flush();

            Logger.Info($"Saved {typeof(DbModel).Name} with id of '{model.Id}'");

            return model.Id;
        }

        public virtual void Delete(Guid id)
        {
            var query = Session.CreateQuery($"delete from {typeof(DbModel).Name} where Id = :id");
            query.SetParameter("id", id);
            var result = query.ExecuteUpdate();

            if (result != 1)
                throw new ArgumentNullException($"{typeof(DbModel).Name} with the id of '{id}' was not found");

            Logger.Info($"Deleted {typeof(DbModel)} with id of '{id}'");
        }

        public virtual DbModel Get(Guid id)
        {
            var model = Session.Load<DbModel>(id);

            if (model == null)
                throw new ArgumentOutOfRangeException($"{typeof(DbModel).Name} with the id of '{id}' was not found");

            return model;
        }

        public virtual IEnumerable<DbModel> List(int offset, int limit)
        {
            return Session.Query<DbModel>()
                .Skip(offset)
                .Take(limit)
                .ToList();
        }

        public virtual long Count()
        {
            return Session.Query<DbModel>()
                .LongCount();
        }
    }
}
