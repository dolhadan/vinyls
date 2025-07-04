import { Command } from 'commander';
import inquirer from 'inquirer';
import { MusicBrainzApi, CoverArtArchiveApi } from 'musicbrainz-api';
import { createWriteStream, readFileSync, writeFileSync } from 'fs';
import { pipeline } from 'stream/promises';
import axios from 'axios';

interface Record {
    artist: string;
    title: string;
    publishedAt: string;
    releaseID?: string;
    id: number;
}

interface Collection {
    records: Record[];
    wishlist: Record[];
    metadata: {
        lastUsedID: number;
    };
}

const program = new Command();

const mbApi = new MusicBrainzApi({
    appName: 'vinyls-cli',
    appVersion: '1.0.0',
    appContactInfo: 'dolha.dan@gmail.com',
});

const coverArtApi = new CoverArtArchiveApi();

function readCollection(): Collection {
    try {
        return JSON.parse(readFileSync('./src/collections.json', 'utf-8'));
    } catch {
        console.log("Couldn't read collection file");
        return {
            records: [],
            wishlist: [],
            metadata: {
                lastUsedID: -1,
            },
        };
    }
}

function saveCollection(collection: Collection) {
    writeFileSync('./src/collections.json', JSON.stringify(collection, null, 2), 'utf-8');
}

async function downloadImage(imageUrl: string, savePath: string): Promise<void> {
    const response = await axios.get(imageUrl, { responseType: 'stream' });

    await pipeline(response.data, createWriteStream(savePath));
}

async function searchAlbums(artist?: string, album?: string) {
    const queryParts = [];
    if (artist) {
        queryParts.push(`artist:"${artist}"`);
    }
    if (album) {
        queryParts.push(`album:"${album}"`);
    }
    queryParts.push('primarytype:"album"');

    const result = await mbApi.search('release-group', {
        query: queryParts.join(' and '),
        limit: 100,
    });
    return result['release-groups'];
}

function getDisplayName(group: any): string {
    const artist = group['artist-credit']?.[0]?.name || 'Unknown Artist';
    return `${group.title} - ${artist}`;
}

async function getCoverArt(releaseId: string): Promise<string | undefined> {
    try {
        const art = await coverArtApi.getReleaseGroupCovers(releaseId);
        const front = art.images?.find(
            (img: any) => img.front === true || img.types?.includes('Front'),
        );

        return front?.thumbnails.large;
    } catch (error) {
        console.log(error);
        return undefined;
    }
}

async function handleSearch(
    artistQuery?: string,
    albumQuery?: string,
    wishlist?: boolean,
): Promise<void> {
    if (!artistQuery && !albumQuery) {
        console.log('Please provide an artist or an album');
        return;
    }
    const releaseGroups = await searchAlbums(artistQuery, albumQuery);

    if (!releaseGroups.length) {
        console.log('No albums found.');
        return;
    }

    const { selectedGroupId } = await inquirer.prompt({
        type: 'list',
        name: 'selectedGroupId',
        message: 'Select an album:',
        choices: releaseGroups.map(group => ({
            name: getDisplayName(group),
            value: group.id,
        })),
    });

    const selectedGroup = releaseGroups.find(g => g.id === selectedGroupId);

    const title = selectedGroup?.title || 'Unknown';
    const artist = selectedGroup?.['artist-credit']?.[0]?.name || 'Unknown';
    const date = selectedGroup?.['first-release-date'] || 'Unknown';
    const coverArtUrl = await getCoverArt(selectedGroupId);

    const collection = readCollection();

    const song: Record = {
        artist: selectedGroup?.['artist-credit']?.[0]?.name || 'Unknown',
        title: selectedGroup?.title || 'Unknown',
        publishedAt: selectedGroup?.['first-release-date'] || 'Unknown',
        releaseID: selectedGroup?.id,
        id: collection.metadata.lastUsedID + 1,
    };

    if (coverArtUrl) {
        await downloadImage(coverArtUrl, `./public/covers/${song.id}.jpg`);
    }

    if (wishlist) {
        collection.wishlist.push(song);
    } else {
        collection.records.push(song);
    }

    collection.metadata.lastUsedID = song.id;

    saveCollection(collection);

    console.log(
        JSON.stringify(
            {
                artist,
                album: title,
                year: date.split('-')[0],
                coverURL: coverArtUrl,
            },
            null,
            2,
        ),
    );
}

program
    .name('vinyls')
    .description('Search for albums and show artist, date, and cover')
    .option('--artist <name>', 'Artist name')
    .option('--album <name>', 'Album title')
    .option('-w, --wishlist', 'Wishlist or nor')
    .action(async options => {
        const { artist, album, wishlist } = options;
        await handleSearch(artist, album, wishlist);
    });

program.parseAsync(process.argv);
