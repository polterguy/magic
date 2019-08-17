/*
 * Magic, Copyright(c) Thomas Hansen 2019 - thomas@gaiasoul.com
 * Licensed as Affero GPL unless an explicitly proprietary license has been obtained.
 */

namespace magic.io.controller
{
    /// <summary>
    /// View model for copying and moving files and folders
    /// </summary>
    public class CopyMoveModel
    {
        /// <summary>
        /// Source path of file or folder to move or copy
        /// </summary>
        public string Source { get; set; }

        /// <summary>
        /// Destination path of file or folder to move or copy
        /// </summary>
        public string Destination { get; set; }
    }
}
