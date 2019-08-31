
/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

namespace magic.endpoint.services.init
{
    static class Utilities
    {
        public static bool IsLegalHttpName(string folder)
        {
            foreach (var idx in folder)
            {
                switch (idx)
                {
                    case '-':
                    case '_':
                    case '/':
                        break;
                    default:
                        if ((idx < 'a' || idx > 'z') &&
                            (idx < 'A' || idx > 'Z') &&
                            (idx < '0' || idx > '9'))
                            return false;
                        break;
                }
            }
            return true;
        }
    }
}
